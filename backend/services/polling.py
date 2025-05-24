from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from services.db import SessionLocal
from services.models import WatchlistItem, OptionPremiumHistory
from datetime import datetime, timezone, time
import yfinance as yf
import pytz
import holidays
import httpx

us_holidays = holidays.US()

class PollingManager:
    def __init__(self):
        self.scheduler = AsyncIOScheduler(timezone=pytz.timezone("US/Eastern"))
        
    async def start(self):
        if not self.scheduler.running:
            # Schedule polling job with a cron trigger for weekdays 
            self.scheduler.add_job(
                self.polling_job_wrapper,
                CronTrigger(day_of_week="mon-fri", hour="9-15", minute="*/30"),
                id="fetch_options"
            )
            self.scheduler.start()
            
    async def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)

    async def polling_job_wrapper(self):
        """Wrapper to ensure polling only runs during trading hours."""
        now = datetime.now(pytz.timezone("US/Eastern"))
        if self.is_trading_hours(now):
            print(f"Polling triggered at {now}")
            await fetch_option_premiums()
        else:
            print(f"Skipping polling at {now} (outside trading hours)")

    def is_trading_hours(self, now):
        """Check if the current time is within NYSE trading hours."""
        # Check if it's a federal holiday
        if now.date() in us_holidays:
            return False

        
        if now.weekday() >= 5:  
            return False

        
        market_open = time(9, 30)  # 9:30 AM
        market_close = time(16, 0)  # 4:00 PM
        return market_open <= now.time() <= market_close

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
                print(f"Processing option: {item.symbol}, Strike: {item.strike}, Expiration: {item.expiration}")
                
                # Use the same endpoint that frontend uses
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"http://127.0.0.1:8000/options/{item.symbol}?expiration={item.expiration}"
                    )
                
                if not response.is_success:
                    print(f"Failed to fetch options data for {item.symbol}")
                    continue

                options_data = response.json()
                
                # Get the correct option chain (calls or puts)
                option_chain = options_data['calls' if item.option_type.lower() == 'calls' else 'puts']
                
                # Find the specific option
                option = next(
                    (opt for opt in option_chain if opt['strike'] == item.strike), 
                    None
                )

                if option:
                    print(f"Found {item.option_type} option with strike {item.strike} in chain")  # Debug log
                    bid = float(option['bid']) if option['bid'] else None
                    ask = float(option['ask']) if option['ask'] else None
                    last_price = float(option['lastPrice']) if option['lastPrice'] else 0

                    print(f"Raw values - Bid: {option['bid']}, Ask: {option['ask']}")  # Debug log

                    # Calculate premium using bid/ask if available
                    if bid is not None and ask is not None:
                        premium = (bid + ask) / 2
                    else:
                        premium = last_price

                    print(f"Bid: {bid}, Ask: {ask}, Last Price: {last_price}, Calculated Premium: {premium}")

                    history_entry = OptionPremiumHistory(
                        watchlist_id=item.id,
                        firebase_uid=item.firebase_uid,
                        contract_symbol=option['contractSymbol'],
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