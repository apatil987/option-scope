from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from services.db import SessionLocal
from services.models import WatchlistItem, OptionPremiumHistory, OptionEVHistory
from datetime import datetime, timezone, time
import yfinance as yf
import pytz
import holidays
import httpx
from math import log, sqrt
from scipy.stats import norm
from zoneinfo import ZoneInfo

us_holidays = holidays.US()

class PollingManager:
    def __init__(self):
        self.scheduler = AsyncIOScheduler(timezone=pytz.timezone("US/Eastern"))
        
    async def start(self):
        if not self.scheduler.running:
            # Schedule both premium and EV polling
            self.scheduler.add_job(
                self.polling_job_wrapper,
                CronTrigger(day_of_week="mon-fri", hour="9-15", minute="*/30"),
                id="fetch_options"
            )
            self.scheduler.add_job(
                fetch_option_ev,
                CronTrigger(day_of_week="mon-fri", hour="9-15", minute="*/30"),
                id="fetch_ev"
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
            await fetch_option_ev()
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

async def fetch_option_ev():
    """Fetch and store EV calculations for all options in watchlists"""
    db = SessionLocal()
    try:
        print("\n=== Starting EV Calculations ===")
        
        watchlist_items = db.query(WatchlistItem).filter(
            WatchlistItem.option_type.isnot(None),
            WatchlistItem.strike.isnot(None),
            WatchlistItem.expiration.isnot(None),
            WatchlistItem.expiration != ''
        ).all()
        
        print(f"Found {len(watchlist_items)} options to process")

        for item in watchlist_items:
            try:
                print(f"\nProcessing {item.symbol} {item.option_type} {item.strike} {item.expiration}")
                
                # Get option details
                ticker = yf.Ticker(item.symbol)
                stock_price = ticker.history(period="1d")["Close"].iloc[-1]
                print(f"Current stock price: {stock_price}")
                
                # Get option chain
                print("Fetching option chain...")
                chain = ticker.option_chain(item.expiration)
                options = chain.calls if item.option_type.lower() == "calls" else chain.puts
                print(f"Found {len(options)} options in the chain")
                
                # Find our specific option
                matching_options = options[options["strike"] == item.strike]
                if matching_options.empty:
                    print(f"No matching option found for strike {item.strike}")
                    continue
                    
                option = matching_options.iloc[0]
                print(f"Found matching option with IV: {option['impliedVolatility']}")
                
                # Generate contract symbol
                contract_symbol = f"{item.symbol}{item.expiration}{item.strike}{item.option_type}"
                print(f"Contract symbol: {contract_symbol}")
                
                # Calculate time to expiration
                expiration_date = datetime.strptime(item.expiration, "%Y-%m-%d")
                current_date = datetime.now()
                T = (expiration_date - current_date).days / 365
                print(f"Time to expiration (years): {T}")

                if T <= 0:
                    print(f"Skipping expired option: {contract_symbol}")
                    continue

                # Calculate EV components
                sigma = option["impliedVolatility"]
                r = 0.05  # risk-free rate
                
                print("Calculating Black-Scholes components...")
                d1 = (log(stock_price / item.strike) + (r + 0.5 * sigma ** 2) * T) / (sigma * sqrt(T))
                d2 = d1 - sigma * sqrt(T)
                print(f"d1: {d1}, d2: {d2}")

                if item.option_type.lower() == "calls":
                    p_win = norm.cdf(d2)
                    delta = norm.cdf(d1)
                    breakeven = item.strike + option["lastPrice"]
                    est_price = item.strike + (sigma * stock_price)
                    profit_itm = max(0, est_price - item.strike - option["lastPrice"])
                else:
                    p_win = norm.cdf(-d2)
                    delta = -norm.cdf(-d1)
                    breakeven = item.strike - option["lastPrice"]
                    est_price = item.strike - (sigma * stock_price)
                    profit_itm = max(0, item.strike - est_price - option["lastPrice"])

                loss = option["lastPrice"]
                ev = (p_win * profit_itm) - ((1 - p_win) * loss)

                print(f"Calculation results:")
                print(f"- EV: {ev}")
                print(f"- P(win): {p_win}")
                print(f"- Delta: {delta}")
                print(f"- Max Gain: {profit_itm}")
                print(f"- Max Loss: {loss}")
                print(f"- Breakeven: {breakeven}")

                print("Creating EV history record...")
                # Convert NumPy values to Python native types before creating DB record
                ev_record = OptionEVHistory(
                    watchlist_id=item.id,
                    firebase_uid=item.firebase_uid,
                    contract_symbol=contract_symbol,
                    ev=float(ev),  # Convert to native float
                    probability=float(p_win),
                    delta=float(delta),
                    max_gain=float(profit_itm),
                    max_loss=float(loss),
                    breakeven=float(breakeven),
                    recorded_at=datetime.now(ZoneInfo("UTC"))
                )
                
                db.add(ev_record)
                db.commit()
                print(f"Saved EV record for {contract_symbol}")

            except Exception as e:
                print(f"Error processing option: {str(e)}")
                db.rollback()  # Roll back on error
                continue

    except Exception as e:
        print(f"Error in EV polling: {str(e)}")
        db.rollback()
    finally:
        db.close()
        print("=== EV Calculations Complete ===\n")

# Create and export the polling manager instance
polling_manager = PollingManager()