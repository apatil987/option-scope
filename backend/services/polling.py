from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from services.db import SessionLocal
from services.models import WatchlistItem, OptionPremiumHistory
from datetime import datetime, timezone
import yfinance as yf

class PollingManager:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        
    async def start(self):
        if not self.scheduler.running:
            # Schedule recurring job
            self.scheduler.add_job(
                fetch_option_premiums,
                "interval",
                minutes=30,
                id="fetch_options"
            )
            # Run immediately on startup
            self.scheduler.add_job(
                fetch_option_premiums,
                "date",
                run_date=datetime.now(),
                id="initial_fetch"
            )
            self.scheduler.start()
            
    async def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)

async def fetch_option_premiums():
    db = SessionLocal()
    try:
        watchlist_items = db.query(WatchlistItem).filter(
            WatchlistItem.option_type.isnot(None),
            WatchlistItem.strike.isnot(None),
            WatchlistItem.expiration.isnot(None),
            WatchlistItem.expiration != ''
        ).all()

        for item in watchlist_items:
            try:
                ticker = yf.Ticker(item.symbol)
                options = ticker.option_chain(item.expiration)
                option_data = (
                    options.calls if item.option_type.lower() == "call" 
                    else options.puts
                )
                
                option = option_data[option_data["strike"] == item.strike]
                if not option.empty:
                    premium = float(option.iloc[0]["lastPrice"])
                    contract_symbol = str(option.iloc[0]["contractSymbol"])
                    
                    history_entry = OptionPremiumHistory(
                        watchlist_id=item.id,  # Add the watchlist_id reference
                        firebase_uid=item.firebase_uid,
                        contract_symbol=contract_symbol,
                        ticker=item.symbol,
                        strike=item.strike,
                        expiration=item.expiration,
                        option_type=item.option_type,
                        premium=premium,
                        recorded_at=datetime.now(timezone.utc)
                    )
                    db.add(history_entry)
                    
            except Exception as e:
                print(f"Error processing option {item.symbol}: {str(e)}")
                continue
                
        db.commit()
    except Exception as e:
        print(f"Error in fetch_option_premiums: {str(e)}")
        db.rollback()
    finally:
        db.close()

# Create a single instance of the PollingManager
polling_manager = PollingManager()