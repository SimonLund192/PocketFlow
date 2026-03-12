from datetime import datetime, timezone

import pytest

from app.database import budget_line_items_collection, budgets_collection, categories_collection
from app.services.import_service import ImportService


@pytest.mark.asyncio
class TestImportServiceSuggestions:
    async def test_apply_historical_suggestions_uses_exact_and_token_history(
        self,
        db_session,
        test_user_id,
    ):
        now = datetime.now(timezone.utc)

        groceries = await categories_collection.insert_one(
            {
                "user_id": test_user_id,
                "name": "Groceries",
                "type": "expense",
                "icon": "cart",
                "color": "#22c55e",
                "created_at": now,
                "updated_at": now,
            }
        )
        rent = await categories_collection.insert_one(
            {
                "user_id": test_user_id,
                "name": "Rent",
                "type": "expense",
                "icon": "home",
                "color": "#3b82f6",
                "created_at": now,
                "updated_at": now,
            }
        )
        budget = await budgets_collection.insert_one(
            {
                "user_id": test_user_id,
                "month": "2026-01",
                "created_at": now,
                "updated_at": now,
            }
        )

        history = [
            ("Netto", groceries.inserted_id, "user1"),
            ("NETTO 1234 AALBORG", groceries.inserted_id, "user1"),
            ("Foetex", groceries.inserted_id, "user1"),
            ("Lidl Danmark", groceries.inserted_id, "user1"),
            ("Bilka To Go", groceries.inserted_id, "user1"),
            ("HIMMERLAND BOLIGFORENING", rent.inserted_id, "shared"),
        ]

        for name, category_id, owner_slot in history:
            await budget_line_items_collection.insert_one(
                {
                    "user_id": test_user_id,
                    "budget_id": budget.inserted_id,
                    "name": name,
                    "category_id": category_id,
                    "amount": 100,
                    "owner_slot": owner_slot,
                    "created_at": now,
                    "updated_at": now,
                }
            )

        rows = [
            {
                "date": "2026-03-01",
                "description": "NETTO 8877 CITY",
                "amount": -450.0,
                "is_expense": True,
                "abs_amount": 450.0,
                "category_id": None,
                "owner_slot": "user1",
                "include": True,
            },
            {
                "date": "2026-03-01",
                "description": "HIMMERLAND A/S",
                "amount": -6500.0,
                "is_expense": True,
                "abs_amount": 6500.0,
                "category_id": None,
                "owner_slot": "user1",
                "include": True,
            },
        ]

        enriched = await ImportService.apply_historical_suggestions(test_user_id, rows)

        assert enriched[0]["category_id"] == str(groceries.inserted_id)
        assert enriched[0]["owner_slot"] == "user1"
        assert enriched[0]["suggestion_basis"] == "history_tokens"
        assert "netto" in enriched[0]["matched_terms"]

        assert enriched[1]["category_id"] == str(rent.inserted_id)
        assert enriched[1]["owner_slot"] == "shared"
        assert "himmerland" in enriched[1]["matched_terms"]

    async def test_apply_historical_suggestions_is_user_specific(
        self,
        db_session,
        test_user_id,
    ):
        now = datetime.now(timezone.utc)
        other_user_id = "someone_else"

        groceries = await categories_collection.insert_one(
            {
                "user_id": other_user_id,
                "name": "Groceries",
                "type": "expense",
                "icon": "cart",
                "color": "#22c55e",
                "created_at": now,
                "updated_at": now,
            }
        )
        budget = await budgets_collection.insert_one(
            {
                "user_id": other_user_id,
                "month": "2026-01",
                "created_at": now,
                "updated_at": now,
            }
        )
        await budget_line_items_collection.insert_one(
            {
                "user_id": other_user_id,
                "budget_id": budget.inserted_id,
                "name": "Netto",
                "category_id": groceries.inserted_id,
                "amount": 100,
                "owner_slot": "user1",
                "created_at": now,
                "updated_at": now,
            }
        )

        rows = [
            {
                "date": "2026-03-01",
                "description": "NETTO 8877 CITY",
                "amount": -450.0,
                "is_expense": True,
                "abs_amount": 450.0,
                "category_id": None,
                "owner_slot": "user1",
                "include": True,
            }
        ]

        enriched = await ImportService.apply_historical_suggestions(test_user_id, rows)

        assert enriched[0]["category_id"] is None
        assert enriched[0]["suggestion_basis"] is None
        assert enriched[0]["matched_terms"] == []
