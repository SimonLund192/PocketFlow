from fastapi import APIRouter, HTTPException
from typing import List
from app.models import Transaction, TransactionCreate
from app.database import transactions_collection
from bson import ObjectId

router = APIRouter()


@router.get("", response_model=List[Transaction])
async def get_transactions():
    """Get all transactions"""
    transactions = []
    async for transaction in transactions_collection.find():
        transactions.append(Transaction(**transaction))
    return transactions


@router.post("", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate):
    """Create a new transaction"""
    transaction_dict = transaction.model_dump()
    result = await transactions_collection.insert_one(transaction_dict)
    created_transaction = await transactions_collection.find_one({"_id": result.inserted_id})
    return Transaction(**created_transaction)


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: str):
    """Delete a transaction"""
    if not ObjectId.is_valid(transaction_id):
        raise HTTPException(status_code=400, detail="Invalid transaction ID")
    
    result = await transactions_collection.delete_one({"_id": ObjectId(transaction_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {"message": "Transaction deleted successfully"}
