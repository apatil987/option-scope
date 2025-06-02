from fastapi import APIRouter, HTTPException, Query, Depends, Body
from sqlalchemy.orm import Session
from datetime import datetime
from zoneinfo import ZoneInfo
from pydantic import BaseModel
from typing import Optional
import yfinance as yf
from math import log, sqrt
from scipy.stats import norm

from services.db import SessionLocal
from services.models import User, UserCreate, WatchlistItem, OptionPremiumHistory, OptionEVHistory
from services.stock_service import get_stock_quote, get_option_chain
from services.polling import fetch_option_premiums, fetch_option_ev

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
        print(f"Received watchlist request: {item}")

        # Validate option data consistency
        has_option_fields = any([item.option_type, item.strike, item.expiration])
        has_valid_expiration = item.expiration and item.expiration.strip() != ''

        if has_option_fields:
            if not all([item.option_type, item.strike]) or not has_valid_expiration:
                print(f"Invalid option data: type={item.option_type}, strike={item.strike}, exp={item.expiration}")
                raise HTTPException(
                    status_code=400, 
                    detail="Please select an expiration date and provide all option fields"
                )

        # Check for existing item
        existing = db.query(WatchlistItem).filter(
            WatchlistItem.firebase_uid == item.firebase_uid,
            WatchlistItem.symbol == item.symbol,
            WatchlistItem.option_type == item.option_type,
            WatchlistItem.strike == item.strike,
            WatchlistItem.expiration == item.expiration
        ).first()

        if existing:
            raise HTTPException(status_code=409, detail="Already in watchlist")

        new_item = WatchlistItem(
            firebase_uid=item.firebase_uid,
            symbol=item.symbol,
            option_type=item.option_type,
            strike=item.strike,
            expiration=item.expiration if has_valid_expiration else None,
            added_at=datetime.now(ZoneInfo("UTC"))
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        
        return {"message": "Added to watchlist", "item": new_item}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error adding to watchlist: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/get_watchlist/{firebase_uid}")
def get_watchlist(firebase_uid: str, type: str = Query("stocks"), db: Session = Depends(get_db)):
    try:
        query = db.query(WatchlistItem).filter(
            WatchlistItem.firebase_uid == firebase_uid
        )
        
        if type == "stocks":
            items = query.filter(
                WatchlistItem.option_type.is_(None),
                WatchlistItem.strike.is_(None),
                WatchlistItem.expiration.is_(None)
            ).all()
        elif type == "options":
            items = query.filter(
                WatchlistItem.option_type.isnot(None),
                WatchlistItem.strike.isnot(None),
                WatchlistItem.expiration.isnot(None),
                WatchlistItem.expiration != ''
            ).order_by(WatchlistItem.symbol, WatchlistItem.expiration).all()
        else:
            raise HTTPException(status_code=400, detail="Invalid type parameter")
        
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/remove_from_watchlist/")
def remove_from_watchlist(
    firebase_uid: str = Body(...),
    symbol: str = Body(...),
    option_type: str = Body(None),
    strike: float = Body(None),
    expiration: str = Body(None),
    db: Session = Depends(get_db)
):
    try:
        # print(f"Removing item: {symbol} {option_type} {strike} {expiration}")  # Debug log
        
        # Build base query
        query = db.query(WatchlistItem).filter(
            WatchlistItem.firebase_uid == firebase_uid,
            WatchlistItem.symbol == symbol
        )

        if option_type and strike and expiration:
            # Remove specific option
            query = query.filter(
                WatchlistItem.option_type == option_type,
                WatchlistItem.strike == strike,
                WatchlistItem.expiration == expiration
            )
        else:
            # Remove stock (ensure we don't delete options)
            query = query.filter(
                WatchlistItem.option_type.is_(None),
                WatchlistItem.strike.is_(None),
                WatchlistItem.expiration.is_(None)
            )

        # Get the item before deletion
        item = query.first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        try:
            # Delete associated option premium history if it exists
            if item.option_type:
                db.query(OptionPremiumHistory).filter(
                    OptionPremiumHistory.watchlist_id == item.id
                ).delete(synchronize_session='fetch')

            # Delete the watchlist item
            db.delete(item)
            db.commit()
            
            return {"message": "Item removed successfully"}
            
        except Exception as db_error:
            db.rollback()
            print(f"Database error: {str(db_error)}")  # Debug log
            raise HTTPException(status_code=500, detail="Database error during deletion")

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Error removing item: {str(e)}")

@router.post("/update_last_login/")
def update_last_login(payload: LastLoginUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.firebase_uid == payload.firebase_uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.last_login = datetime.now(ZoneInfo("UTC"))
    db.commit()
    return {"message": "Last login updated", "last_login": user.last_login.isoformat()}

@router.get("/stock_sparkline/{symbol}")
def stock_sparkline(
    symbol: str,
    interval: str = Query(default="1d", regex="^(1d|5d|1mo|3mo|6mo|1y)$")
):
    try:
        ticker = yf.Ticker(symbol)
        
        # Map frontend intervals to yfinance parameters and labels
        interval_settings = {
            "1d": {"period": "1d", "interval": "5m", "label": "1 Day"},
            "5d": {"period": "5d", "interval": "15m", "label": "5 Days"},
            "1mo": {"period": "1mo", "interval": "1d", "label": "1 Month"},
            "3mo": {"period": "3mo", "interval": "1d", "label": "3 Months"},
            "6mo": {"period": "6mo", "interval": "1d", "label": "6 Months"},
            "1y": {"period": "1y", "interval": "1d", "label": "1 Year"}
        }
        
        settings = interval_settings.get(interval, interval_settings["1d"])
        
        # Get sparkline data for the extended interval
        hist = ticker.history(
            period=settings["period"],
            interval=settings["interval"]
        )
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="No data found for symbol")
        
        # Use the last valid close price as the current price
        current_price = hist["Close"].iloc[-1]
        
        # For intervals other than 1d, use the second-to-last data point as the starting price
        if interval != "1d":
            period_start_price = hist["Close"].iloc[9]  # First valid close price
        else:
            # For 1d, use the previous day's close
            info = ticker.info
            period_start_price = info.get("previousClose", hist["Close"].iloc[0])
        
        # Calculate change for the selected period
        change = current_price - period_start_price
        change_percent = (change / period_start_price * 100) if period_start_price else 0
        
        # Convert prices to a list for the sparkline
        prices = hist["Close"].tolist()
        
        return {
            "price": current_price,
            "change": change,
            "changePercent": change_percent,
            "sparkline": prices,
            "periodLabel": settings["label"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/option_price_history/{watchlist_id}")
async def get_option_price_history(
    watchlist_id: int,
    db: Session = Depends(get_db)
):
    try:
        #print(f"Fetching history for watchlist_id: {watchlist_id}")  # Debug log
        
        # First verify the watchlist item exists
        watchlist_item = db.query(WatchlistItem).filter(
            WatchlistItem.id == watchlist_id
        ).first()
        
        if not watchlist_item:
            raise HTTPException(status_code=404, detail="Watchlist item not found")

        history = (
            db.query(OptionPremiumHistory)
            .filter(OptionPremiumHistory.watchlist_id == watchlist_id)
            .order_by(OptionPremiumHistory.recorded_at.asc())
            .all()
        )
        
        #print(f"Found {len(history)} history records")  # Debug log
        
        if not history:
            raise HTTPException(status_code=404, detail="No price history found")
            
        return [
            {
                "premium": float(record.premium),
                "recorded_at": record.recorded_at.isoformat(),
            }
            for record in history
        ]
    except Exception as e:
        print(f"Error fetching option history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger_polling/")
async def trigger_polling():
    try:
        await fetch_option_ev()
        #await fetch_option_premiums()
        return {"message": "Polling triggered successfully"}
    except Exception as e:
        return {"error": str(e)}

@router.post("/calculate_ev")
def calculate_ev(
    S: float = Body(...),  # current stock price
    K: float = Body(...),  # strike
    T: float = Body(...),  # time in years
    r: float = Body(...),  # risk-free rate
    sigma: float = Body(...),  # implied volatility (decimal)
    option_type: str = Body(...),  # "call" or "put"
    premium: float = Body(...),  # option cost
    price_itm: float = Body(None),  # expected stock price if ITM (optional)
):
    try:
        if T <= 0 or sigma <= 0:
            raise ValueError("Invalid time or volatility")

        # Calculate d1 and d2
        d1 = (log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * sqrt(T))
        d2 = d1 - sigma * sqrt(T)

        # Handle calls and puts differently
        if option_type.lower() == "calls":
            p_win = norm.cdf(d2)        # probability of expiring ITM
            delta = norm.cdf(d1)        # option's delta
            breakeven = K + premium
            est_price = price_itm if price_itm else K + (sigma * S)  # estimate ITM price
            profit_itm = max(0, est_price - K - premium)
        elif option_type.lower() == "puts":
            p_win = norm.cdf(-d2)
            delta = -norm.cdf(-d1)
            breakeven = K - premium
            est_price = price_itm if price_itm else K - (sigma * S)
            profit_itm = max(0, K - est_price - premium)
        else:
            raise ValueError("Invalid option type: must be 'call' or 'put'")

        loss = premium
        ev = (p_win * profit_itm) - ((1 - p_win) * loss)

        return {
            "ev": round(ev, 4),
            "probability": round(p_win, 4),
            "delta": round(delta, 4),
            "max_gain": round(profit_itm, 4),
            "max_loss": round(loss, 4),
            "breakeven": round(breakeven, 4),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/option_details/{symbol}/{expiration}/{strike}/{type}")
def get_option_details(symbol: str, expiration: str, strike: float, type: str):
    try:
        ticker = yf.Ticker(symbol)
        option_chain = ticker.option_chain(expiration)
        options = option_chain.calls if type == "call" else option_chain.puts

        option = options[options["strike"] == strike]
        if option.empty:
            raise HTTPException(status_code=404, detail="Option not found")

        premium = option.iloc[0]["lastPrice"]
        iv = option.iloc[0]["impliedVolatility"]
        stock_price = ticker.history(period="1d")["Close"].iloc[-1]

        return {
            "premium": premium,
            "iv": iv * 100,  # Convert to percentage
            "stock_price": stock_price,
            "price_itm": stock_price + 10 if type == "call" else stock_price - 10,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/option_ev_history/{watchlist_id}")
async def get_option_ev_history(
    watchlist_id: int,
    db: Session = Depends(get_db)
):
    try:
        history = (
            db.query(OptionEVHistory)
            .filter(OptionEVHistory.watchlist_id == watchlist_id)
            .order_by(OptionEVHistory.recorded_at.asc())
            .all()
        )
        
        if not history:
            raise HTTPException(status_code=404, detail="No EV history found")
            
        return [
            {
                "ev": float(record.ev),
                "probability": float(record.probability),
                "delta": float(record.delta),
                "max_gain": float(record.max_gain),
                "max_loss": float(record.max_loss),
                "breakeven": float(record.breakeven),
                "recorded_at": record.recorded_at.isoformat(),
            }
            for record in history
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

