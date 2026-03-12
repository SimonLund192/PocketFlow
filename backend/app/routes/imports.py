"""
Import routes — CSV bank statement upload, preview, and budget reconciliation.
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from app.dependencies import get_current_user_id
from app.services.import_service import ImportService

router = APIRouter(prefix="/api/import", tags=["import"])


# ---------- Request / Response schemas ----------

class ParsedRow(BaseModel):
    """A single parsed CSV row returned from the upload step."""
    date: str = ""
    description: str = ""
    amount: float = 0.0
    is_expense: bool = False
    abs_amount: float = 0.0
    category_id: Optional[str] = None
    owner_slot: Literal["user1", "user2", "shared"] = "user1"
    include: bool = True
    suggestion_confidence: Optional[float] = None
    suggestion_basis: Optional[str] = None
    matched_terms: List[str] = Field(default_factory=list)
    matched_example: Optional[str] = None


class UploadResponse(BaseModel):
    rows: List[ParsedRow]
    count: int
    header: List[str]
    delimiter: str


class CategoryOption(BaseModel):
    id: str
    name: str
    type: str
    icon: str = ""
    color: str = ""


class ConfirmEntry(BaseModel):
    name: str = Field(..., min_length=1)
    category_id: str
    amount: float = Field(..., ge=0)
    owner_slot: Literal["user1", "user2", "shared"] = "user1"


class ConfirmRequest(BaseModel):
    month: str = Field(..., pattern=r"^\d{4}-(0[1-9]|1[0-2])$")
    entries: List[ConfirmEntry]


class ConfirmResponse(BaseModel):
    saved_count: int
    error_count: int
    saved: List[dict]
    errors: List[str]


# ---------- Endpoints ----------

@router.post("/upload", response_model=UploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    """
    Upload a CSV bank statement file.
    Returns parsed rows with auto-detected columns.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file type
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    try:
        content = await file.read()
        # Try UTF-8 first, fall back to latin-1 (common for Danish bank exports)
        try:
            csv_text = content.decode("utf-8")
        except UnicodeDecodeError:
            csv_text = content.decode("latin-1")

        result = ImportService.parse_csv(csv_text)
        result["rows"] = await ImportService.apply_historical_suggestions(user_id, result["rows"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse CSV: {str(e)}")


@router.post("/upload-text", response_model=UploadResponse)
async def upload_csv_text(
    body: dict,
    user_id: str = Depends(get_current_user_id),
):
    """
    Upload CSV content as raw text (for paste-from-clipboard support).
    """
    csv_content = body.get("csv_content", "")
    if not csv_content:
        raise HTTPException(status_code=400, detail="No CSV content provided")

    try:
        result = ImportService.parse_csv(csv_content)
        result["rows"] = await ImportService.apply_historical_suggestions(user_id, result["rows"])
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse CSV: {str(e)}")


@router.get("/categories", response_model=List[CategoryOption])
async def get_categories_for_mapping(
    user_id: str = Depends(get_current_user_id),
):
    """Get user's categories for the mapping step."""
    categories = await ImportService.get_user_categories(user_id)
    return categories


@router.post("/confirm", response_model=ConfirmResponse)
async def confirm_import(
    body: ConfirmRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Confirm and save mapped entries as budget line items.
    Creates the budget for the target month if it doesn't exist.
    """
    if not body.entries:
        raise HTTPException(status_code=400, detail="No entries to import")

    result = await ImportService.confirm_import(
        user_id=user_id,
        month=body.month,
        entries=[e.model_dump() for e in body.entries],
    )
    return result
