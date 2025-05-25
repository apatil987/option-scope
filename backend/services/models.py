from sqlalchemy import Column, Float, Integer, String, DateTime
from datetime import datetime
from services.base import Base
from zoneinfo import ZoneInfo
from pydantic import BaseModel

class UserCreate(BaseModel):
    firebase_uid: str
    email: str
    name: str


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, index=True, nullable=False)
    name = Column(String)
    registered_at = Column(DateTime, default=datetime.now(ZoneInfo("UTC")))
    last_login = Column(DateTime, default=datetime.now(ZoneInfo("UTC"))) 
    preferred_view = Column(String, default="table")  
    account_type = Column(String, default="free")  

class WatchlistItem(Base):
    __tablename__ = "watchlist"
    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, index=True)
    symbol = Column(String, index=True)
    option_type = Column(String, nullable=True)      
    strike = Column(Float, nullable=True)
    expiration = Column(String, nullable=True)
    added_at = Column(DateTime, default=datetime.now(ZoneInfo("UTC")))

class UserProfile(BaseModel):
    firebase_uid: str
    email: str
    name: str
    registered_at: str | None = None
    last_login: str | None = None
    preferred_view: str | None = None
    account_type: str | None = None

    class Config:
        from_attributes = True


class OptionPremiumHistory(Base):
    __tablename__ = "option_premium_history"

    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, index=True)  
    firebase_uid = Column(String, index=True)
    contract_symbol = Column(String)
    ticker = Column(String)
    strike = Column(Float)
    expiration = Column(String)
    option_type = Column(String)  
    premium = Column(Float)
    recorded_at = Column(DateTime, default=datetime.now(ZoneInfo("UTC")))

class WatchlistRequest(BaseModel):
    firebase_uid: str
    symbol: str
    option_type: str | None = None
    strike: float | None = None
    expiration: str | None = None
