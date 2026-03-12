"""
Import Service
Handles CSV bank statement parsing, preview generation, and budget reconciliation.
"""
import csv
import io
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bson import ObjectId
import unicodedata
import re
from collections import defaultdict

from app.database import (
    categories_collection,
    budgets_collection,
    budget_line_items_collection,
)

logger = logging.getLogger(__name__)


class ImportService:
    """Service for CSV bank statement import and budget reconciliation."""

    # Column detection keywords (supports Danish bank exports)
    DATE_KEYWORDS = ["date", "dato", "transaction date", "booking date", "bogført"]
    DESC_KEYWORDS = ["description", "text", "beskrivelse", "merchant", "tekst", "modtager"]
    AMOUNT_KEYWORDS = ["amount", "beløb", "sum", "value", "kr"]
    MATCH_NOISE_TOKENS = {
        "aps", "as", "ab", "dk", "dkk", "eur", "visa", "mastercard", "kort", "card",
        "betaling", "payment", "konto", "kontonr", "overforsel", "overfoersel", "transfer",
        "aut", "automatisk", "mobilepay", "mp", "pos", "purchase", "shop", "store", "web",
        "butikk", "butik", "online", "subscription", "service", "services", "danmark",
        "debit", "credit", "invoice", "regning", "betalinger", "terminal", "ref", "reference",
        "betalingstjeneste", "giro", "pbs", "fi", "dd", "via", "the", "and",
    }

    @staticmethod
    def _detect_delimiter(first_line: str) -> str:
        """Detect CSV delimiter from first line."""
        if "\t" in first_line:
            return "\t"
        if "," in first_line and ";" not in first_line:
            return ","
        return ";"

    @staticmethod
    def _parse_amount(amount_str: str) -> float:
        """Parse amount string handling Danish format (1.234,56) and currency symbols."""
        cleaned = amount_str.replace(" ", "").replace("kr.", "").replace("kr", "").strip()
        # Danish format: 1.234,56 → 1234.56
        if "," in cleaned and "." in cleaned:
            cleaned = cleaned.replace(".", "").replace(",", ".")
        elif "," in cleaned:
            cleaned = cleaned.replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    @classmethod
    def _normalize_description(cls, value: str) -> str:
        normalized = unicodedata.normalize("NFKD", value.lower())
        ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
        collapsed = re.sub(r"[^a-z0-9]+", " ", ascii_text)
        return re.sub(r"\s+", " ", collapsed).strip()

    @classmethod
    def _meaningful_tokens(cls, value: str) -> List[str]:
        normalized = cls._normalize_description(value)
        tokens = []
        for token in normalized.split():
            if len(token) < 2:
                continue
            if token in cls.MATCH_NOISE_TOKENS:
                continue
            if token.isdigit() and len(token) < 4:
                continue
            tokens.append(token)
        return tokens

    @classmethod
    def _candidate_phrases(cls, value: str) -> List[str]:
        tokens = cls._meaningful_tokens(value)
        phrases: List[str] = []
        if not tokens:
            return phrases

        phrases.append(tokens[0])
        if len(tokens) >= 2:
            phrases.append(" ".join(tokens[:2]))
        if len(tokens) >= 3 and tokens[1].isdigit():
            phrases.append(" ".join(tokens[:3]))

        deduped: List[str] = []
        for phrase in phrases:
            if phrase and phrase not in deduped:
                deduped.append(phrase)
        return deduped

    @staticmethod
    def _top_choice(counts: Dict[str, int]) -> Optional[Dict[str, float]]:
        if not counts:
            return None

        ranked = sorted(counts.items(), key=lambda item: item[1], reverse=True)
        top_value, top_count = ranked[0]
        total = sum(counts.values())
        second_count = ranked[1][1] if len(ranked) > 1 else 0

        return {
            "value": top_value,
            "count": top_count,
            "total": total,
            "ratio": top_count / total if total else 0,
            "margin": top_count - second_count,
        }

    @classmethod
    async def _historical_match_indexes(cls, user_id: str) -> Dict[str, Dict[str, Any]]:
        cursor = budget_line_items_collection.find(
            {"user_id": user_id},
            {"name": 1, "category_id": 1, "owner_slot": 1},
        )

        exact_map: Dict[str, Dict[str, Any]] = {}
        phrase_map: Dict[str, Dict[str, Any]] = {}
        token_map: Dict[str, Dict[str, Any]] = {}

        async for item in cursor:
            category_id = item.get("category_id")
            if not category_id:
                continue

            category_key = str(category_id)
            name = item.get("name", "")
            normalized = cls._normalize_description(name)
            if not normalized:
                continue

            exact_entry = exact_map.setdefault(
                normalized,
                {"category_counts": defaultdict(int), "owner_counts": defaultdict(int), "examples": []},
            )
            exact_entry["category_counts"][category_key] += 1
            exact_entry["owner_counts"][item.get("owner_slot", "user1")] += 1
            if len(exact_entry["examples"]) < 3:
                exact_entry["examples"].append(name)

            seen_phrases = set()
            for phrase in cls._candidate_phrases(name):
                if phrase in seen_phrases:
                    continue
                seen_phrases.add(phrase)
                phrase_entry = phrase_map.setdefault(
                    phrase,
                    {"category_counts": defaultdict(int), "owner_counts": defaultdict(int), "examples": []},
                )
                phrase_entry["category_counts"][category_key] += 1
                phrase_entry["owner_counts"][item.get("owner_slot", "user1")] += 1
                if len(phrase_entry["examples"]) < 3:
                    phrase_entry["examples"].append(name)

            seen_tokens = set()
            for token in cls._meaningful_tokens(name):
                if token in seen_tokens:
                    continue
                seen_tokens.add(token)
                token_entry = token_map.setdefault(
                    token,
                    {"category_counts": defaultdict(int), "owner_counts": defaultdict(int), "examples": []},
                )
                token_entry["category_counts"][category_key] += 1
                token_entry["owner_counts"][item.get("owner_slot", "user1")] += 1
                if len(token_entry["examples"]) < 3:
                    token_entry["examples"].append(name)

        return {
            "exact_map": exact_map,
            "phrase_map": phrase_map,
            "token_map": token_map,
        }

    @classmethod
    def _suggest_mapping_for_description(
        cls,
        description: str,
        indexes: Dict[str, Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        normalized = cls._normalize_description(description)
        if not normalized:
            return None

        exact_entry = indexes["exact_map"].get(normalized)
        if exact_entry:
            top_category = cls._top_choice(dict(exact_entry["category_counts"]))
            top_owner = cls._top_choice(dict(exact_entry["owner_counts"]))
            if top_category and top_category["ratio"] >= 0.6:
                confidence = min(0.99, 0.75 + (0.05 * top_category["count"]))
                return {
                    "category_id": top_category["value"],
                    "owner_slot": top_owner["value"] if top_owner else "user1",
                    "suggestion_confidence": round(confidence, 2),
                    "suggestion_basis": "exact_history",
                    "matched_terms": [normalized],
                    "matched_example": exact_entry["examples"][0] if exact_entry["examples"] else description,
                }

        category_scores: Dict[str, float] = defaultdict(float)
        owner_scores: Dict[tuple[str, str], float] = defaultdict(float)
        matched_terms: List[str] = []
        matched_examples: List[str] = []

        for phrase in cls._candidate_phrases(description):
            phrase_entry = indexes["phrase_map"].get(phrase)
            if not phrase_entry:
                continue

            top_category = cls._top_choice(dict(phrase_entry["category_counts"]))
            top_owner = cls._top_choice(dict(phrase_entry["owner_counts"]))
            if not top_category or top_category["ratio"] < 0.75:
                continue

            score = 3.0 * top_category["ratio"] * min(top_category["count"], 3)
            category_scores[top_category["value"]] += score
            if top_owner:
                owner_scores[(top_category["value"], top_owner["value"])] += score
            matched_terms.append(phrase)
            matched_examples.extend(phrase_entry["examples"][:1])

        for token in cls._meaningful_tokens(description):
            token_entry = indexes["token_map"].get(token)
            if not token_entry:
                continue

            top_category = cls._top_choice(dict(token_entry["category_counts"]))
            top_owner = cls._top_choice(dict(token_entry["owner_counts"]))
            if not top_category:
                continue

            # Single strong merchant tokens like "netto" or "himmerland" should carry the suggestion.
            if top_category["count"] == 1 and top_category["ratio"] < 1:
                continue
            if top_category["ratio"] < 0.8:
                continue

            score = 1.4 * top_category["ratio"] * min(top_category["count"], 4)
            category_scores[top_category["value"]] += score
            if top_owner:
                owner_scores[(top_category["value"], top_owner["value"])] += score
            matched_terms.append(token)
            matched_examples.extend(token_entry["examples"][:1])

        if not category_scores:
            return None

        ranked_categories = sorted(category_scores.items(), key=lambda item: item[1], reverse=True)
        top_category_id, top_score = ranked_categories[0]
        second_score = ranked_categories[1][1] if len(ranked_categories) > 1 else 0.0

        if top_score < 2.5:
            return None
        if second_score and top_score < second_score * 1.35:
            return None

        owner_candidates = {
            owner: score
            for (category_id, owner), score in owner_scores.items()
            if category_id == top_category_id
        }
        top_owner = cls._top_choice(owner_candidates)

        return {
            "category_id": top_category_id,
            "owner_slot": top_owner["value"] if top_owner else "user1",
            "suggestion_confidence": round(min(0.96, 0.58 + (top_score / 10)), 2),
            "suggestion_basis": "history_tokens",
            "matched_terms": sorted(set(matched_terms))[:5],
            "matched_example": matched_examples[0] if matched_examples else description,
        }

    @classmethod
    async def apply_historical_suggestions(
        cls,
        user_id: str,
        rows: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        if not rows:
            return rows

        indexes = await cls._historical_match_indexes(user_id)
        enriched_rows: List[Dict[str, Any]] = []
        for row in rows:
            enriched = dict(row)
            suggestion = None
            if indexes["exact_map"] or indexes["phrase_map"] or indexes["token_map"]:
                suggestion = cls._suggest_mapping_for_description(row.get("description", ""), indexes)
            if suggestion:
                enriched["category_id"] = suggestion["category_id"]
                enriched["owner_slot"] = suggestion["owner_slot"]
                enriched["suggestion_confidence"] = suggestion["suggestion_confidence"]
                enriched["suggestion_basis"] = suggestion["suggestion_basis"]
                enriched["matched_terms"] = suggestion["matched_terms"]
                enriched["matched_example"] = suggestion["matched_example"]
            else:
                enriched["suggestion_confidence"] = None
                enriched["suggestion_basis"] = None
                enriched["matched_terms"] = []
                enriched["matched_example"] = None

            enriched_rows.append(enriched)

        return enriched_rows

    @classmethod
    def _detect_columns(cls, header: List[str]) -> Dict[str, Optional[int]]:
        """Detect date, description, and amount column indexes from header."""
        date_col = None
        desc_col = None
        amount_col = None

        for i, h in enumerate(header):
            h_lower = h.lower().strip()
            if date_col is None:
                for kw in cls.DATE_KEYWORDS:
                    if kw in h_lower:
                        date_col = i
                        break
            if desc_col is None:
                for kw in cls.DESC_KEYWORDS:
                    if kw in h_lower:
                        desc_col = i
                        break
            if amount_col is None:
                for kw in cls.AMOUNT_KEYWORDS:
                    if kw in h_lower:
                        amount_col = i
                        break

        # Fallback: assume first 3 columns
        if date_col is None and len(header) >= 1:
            date_col = 0
        if desc_col is None and len(header) >= 2:
            desc_col = 1
        if amount_col is None and len(header) >= 3:
            amount_col = 2

        return {"date": date_col, "description": desc_col, "amount": amount_col}

    @classmethod
    def parse_csv(cls, csv_content: str) -> Dict[str, Any]:
        """
        Parse raw CSV content and return structured rows with column detection.

        Returns:
            Dict with parsed rows, detected header, delimiter, and column mapping.
        """
        if not csv_content.strip():
            raise ValueError("Empty CSV content")

        first_line = csv_content.strip().split("\n")[0]
        delimiter = cls._detect_delimiter(first_line)

        reader = csv.reader(io.StringIO(csv_content.strip()), delimiter=delimiter)
        rows = list(reader)

        if len(rows) < 2:
            raise ValueError("CSV must have at least a header row and one data row")

        header = [h.strip() for h in rows[0]]
        cols = cls._detect_columns(header)
        data_rows = rows[1:]

        max_col = max(v for v in cols.values() if v is not None)

        parsed = []
        for row in data_rows:
            if len(row) <= max_col:
                continue  # skip incomplete rows

            date_val = row[cols["date"]].strip() if cols["date"] is not None else ""
            desc_val = row[cols["description"]].strip() if cols["description"] is not None else ""
            amount = cls._parse_amount(row[cols["amount"]]) if cols["amount"] is not None else 0.0

            if not desc_val and amount == 0:
                continue

            parsed.append({
                "date": date_val,
                "description": desc_val,
                "amount": amount,
                "is_expense": amount < 0,
                "abs_amount": abs(amount),
                # Defaults for the mapping step
                "category_id": None,
                "owner_slot": "user1",
                "include": True,
            })

        return {
            "rows": parsed,
            "count": len(parsed),
            "header": header,
            "delimiter": delimiter,
        }

    @staticmethod
    async def get_user_categories(user_id: str) -> List[Dict[str, Any]]:
        """Fetch all categories for the user, grouped by type."""
        cursor = categories_collection.find({"user_id": user_id}).sort("name", 1)
        categories = []
        async for cat in cursor:
            categories.append({
                "id": str(cat["_id"]),
                "name": cat["name"],
                "type": cat["type"],
                "icon": cat.get("icon", ""),
                "color": cat.get("color", ""),
            })
        return categories

    @staticmethod
    async def confirm_import(
        user_id: str,
        month: str,
        entries: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Confirm and save mapped CSV entries as budget line items.

        Args:
            user_id: The logged-in user's ID
            month: Target month in YYYY-MM format
            entries: List of entries with name, category_id, amount, owner_slot

        Returns:
            Summary with saved/skipped counts
        """
        # Ensure budget exists for target month (auto-create if needed)
        budget = await budgets_collection.find_one({
            "user_id": user_id,
            "month": month,
        })
        if not budget:
            now = datetime.now(timezone.utc)
            result = await budgets_collection.insert_one({
                "user_id": user_id,
                "month": month,
                "created_at": now,
                "updated_at": now,
            })
            budget = await budgets_collection.find_one({"_id": result.inserted_id})

        budget_id = budget["_id"]

        saved = []
        errors = []

        for entry in entries:
            try:
                category_id_str = entry.get("category_id", "")
                if not category_id_str or not ObjectId.is_valid(category_id_str):
                    errors.append(f"Invalid category for '{entry.get('name', 'unknown')}'")
                    continue

                # Verify category belongs to user
                category = await categories_collection.find_one({
                    "_id": ObjectId(category_id_str),
                    "user_id": user_id,
                })
                if not category:
                    errors.append(f"Category not found for '{entry.get('name', 'unknown')}'")
                    continue

                now = datetime.now(timezone.utc)
                line_item_doc = {
                    "user_id": user_id,
                    "budget_id": budget_id,
                    "name": entry.get("name", "Imported item"),
                    "category_id": ObjectId(category_id_str),
                    "amount": abs(float(entry.get("amount", 0))),
                    "owner_slot": entry.get("owner_slot", "user1"),
                    "created_at": now,
                    "updated_at": now,
                }

                result = await budget_line_items_collection.insert_one(line_item_doc)
                saved.append({
                    "id": str(result.inserted_id),
                    "name": entry.get("name"),
                    "amount": abs(float(entry.get("amount", 0))),
                    "category": category.get("name", ""),
                })
            except Exception as e:
                errors.append(f"Error saving '{entry.get('name', 'unknown')}': {str(e)}")
                logger.error(f"Import entry error: {e}")

        return {
            "saved_count": len(saved),
            "error_count": len(errors),
            "saved": saved,
            "errors": errors,
        }
