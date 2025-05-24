from fastapi import APIRouter, HTTPException, Query, Depends, Body
from sqlalchemy.orm import Session
from datetime import datetime
from zoneinfo import ZoneInfo
from pydantic import BaseModel
from typing import Optional
import yfinance as yf

from services.db import SessionLocal
from services.models import User, UserCreate, WatchlistItem
from services.stock_service import get_stock_quote, get_option_chain

router = APIRouter()

class WatchlistRequest(BaseModel):
    firebase_uid: str
    symbol: str
    option_type: Optional[str] = None  
    strike: Optional[float] = None
    expiration: Optional[str] = None

class LastLoginUpdate(BaseModel):
    firebase_uid: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def read_root():
    return {"message": "OptionScope backend is running!"}

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


@router.post("/register_user/")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.firebase_uid == user.firebase_uid).first()
    if existing:
        return {"message": "User already exists", "user_id": existing.id}

    new_user = User(
        firebase_uid=user.firebase_uid,
        email=user.email,
        name=user.name,
        registered_at=datetime.now(ZoneInfo("UTC")),
        last_login=datetime.now(ZoneInfo("UTC")),
        preferred_view="table",
        account_type="free"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered", "user_id": new_user.id}

@router.patch("/update_user/")
def update_user_settings(
    firebase_uid: str = Body(...),
    preferred_view: str = Body(None),
    account_type: str = Body(None),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if preferred_view:
        user.preferred_view = preferred_view
    if account_type:
        user.account_type = account_type

    db.commit()
    db.refresh(user)
    return {"message": "User updated", "user": {
        "preferred_view": user.preferred_view,
        "account_type": user.account_type
    }}

@router.get("/user_profile/{firebase_uid}")
def get_user_profile(firebase_uid: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/add_to_watchlist/")
def add_to_watchlist(item: WatchlistRequest, db: Session = Depends(get_db)):
    try:
        existing = db.query(WatchlistItem).filter_by(
            firebase_uid=item.firebase_uid,
            symbol=item.symbol,
            option_type=item.option_type,
            strike=item.strike,
            expiration=item.expiration
        ).first()

        if existing:
            raise HTTPException(status_code=409, detail="Already in watchlist")

        new_item = WatchlistItem(
            firebase_uid=item.firebase_uid,
            symbol=item.symbol,
            option_type=item.option_type,
            strike=item.strike,
            expiration=item.expiration,
            added_at=datetime.now(ZoneInfo("UTC"))
        )
        db.add(new_item)
        db.commit()
        return {"message": "Added to watchlist"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/get_watchlist/{firebase_uid}")
def get_watchlist(firebase_uid: str, type: str = Query("stocks"), db: Session = Depends(get_db)):
    query = db.query(WatchlistItem).filter(WatchlistItem.firebase_uid == firebase_uid)
    if type == "stocks":
        query = query.filter(WatchlistItem.option_type == None)
    elif type == "options":
        query = query.filter(WatchlistItem.option_type != None)

    return query.all()


@router.delete("/remove_from_watchlist/")
def remove_from_watchlist(
    firebase_uid: str = Body(...),
    symbol: str = Body(...),
    option_type: str = Body(None),
    strike: float = Body(None),
    expiration: str = Body(None),
    db: Session = Depends(get_db)
):
    item = db.query(WatchlistItem).filter_by(
        firebase_uid=firebase_uid,
        symbol=symbol,
        option_type=option_type,
        strike=strike,
        expiration=expiration
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Removed from watchlist"}

@router.post("/update_last_login/")
def update_last_login(payload: LastLoginUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.firebase_uid == payload.firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.last_login = datetime.now(ZoneInfo("UTC"))
    db.commit()
    return {"message": "Last login updated", "last_login": user.last_login.isoformat()}

@router.get("/stock_sparkline/{symbol}")
def stock_sparkline(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        # Get last 7 days of minute or daily data for sparkline
        hist = ticker.history(period="7d", interval="1d")
        if hist.empty:
            raise HTTPException(status_code=404, detail="No data found for symbol")
        prices = hist["Close"].tolist()
        price = float(prices[-1])
        prev_close = float(hist["Close"].iloc[-2]) if len(prices) > 1 else price
        change = price - prev_close
        change_percent = (change / prev_close * 100) if prev_close else 0
        return {
            "price": price,
            "change": change,
            "changePercent": change_percent,
            "sparkline": prices
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))