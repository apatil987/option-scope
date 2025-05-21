from fastapi import APIRouter
from services.stock_service import get_stock_quote, get_option_chain
from fastapi import HTTPException
from fastapi import Query


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

@router.get("/options/{ticker}")
def option_chain(ticker: str, expiration: str = Query(None)):
    try:
        return get_option_chain(ticker, expiration)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
