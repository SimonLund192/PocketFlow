from datetime import datetime
from typing import List

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status, Depends

from app.auth import UserContext, get_user_context
from app.database import get_database
from app.models import Transaction, TransactionCreate

router = APIRouter()


def transaction_helper(transaction) -> dict:
    return {
        "_id": str(transaction["_id"]),
        "type": transaction["type"],
        "category": transaction["category"],
        "amount": transaction["amount"],
        "description": transaction["description"],
        "date": transaction.get("date"),
    }


@router.get("/transactions", response_model=List[Transaction])
async def get_transactions(ctx: UserContext = Depends(get_user_context)):
    db = get_database()
    transactions = []
    async for transaction in db.transactions.find({"user_id": ctx.user_id}).sort(
        "date", -1
    ):
        transactions.append(transaction_helper(transaction))
    return transactions


@router.post("/transactions", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate, ctx: UserContext = Depends(get_user_context)
):
    db = get_database()

    transaction_dict = transaction.model_dump()
    transaction_dict["user_id"] = ctx.user_id
    if transaction_dict["date"] is None:
        transaction_dict["date"] = datetime.utcnow()

    result = await db.transactions.insert_one(transaction_dict)
    new_transaction = await db.transactions.find_one({"_id": result.inserted_id})

    return transaction_helper(new_transaction)


@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: str, ctx: UserContext = Depends(get_user_context)
):
    db = get_database()

    if not ObjectId.is_valid(transaction_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction id",
        )

    result = await db.transactions.delete_one(
        {"_id": ObjectId(transaction_id), "user_id": ctx.user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return {"message": "Transaction deleted successfully"}
