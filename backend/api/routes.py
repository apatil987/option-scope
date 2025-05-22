from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from services.db import SessionLocal
from services.models import User
from services.stock_service import get_stock_quote, get_option_chain
from datetime import datetime
from zoneinfo import ZoneInfo
import console
from services.models import UserCreate
from fastapi import Body

router = APIRouter()

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
    return {
        "preferred_view": user.preferred_view,
        "account_type": user.account_type,
        "last_login": user.last_login.isoformat()
    }
