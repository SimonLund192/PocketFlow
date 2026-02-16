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
