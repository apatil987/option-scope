from fastapi import APIRouter
from services.stock_service import get_stock_quote
from fastapi import HTTPException

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "OptionScope backend is running!"}

@router.get("/ping")
def ping():
    return {"message": "pong"}

@router.get("/stocks/{ticker}")
def stock_lookup(ticker: str):
    try:
        data = get_stock_quote(ticker)
        if data["current_price"] is None:
            raise ValueError("Invalid ticker or missing data")
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
