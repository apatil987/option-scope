from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import yfinance as yf
from sqlalchemy.orm import Session
import httpx
import traceback

from .utils import calculate_ev  # Use local import
from .models import SmartOptionSuggestion
from .db import SessionLocal
from openai import OpenAI
import os
import pandas as pd

api_url = os.getenv("API_URL")

WATCH_SYMBOLS = [
    'AAPL', 'NVDA', 'AMZN', 'PLTR', 'SPY', 'CRWV', 
    'WOLF', 'UNH', 'RDDT', 'VOO', 'QQQ', 'GOOG',
    'TSLA', 'MSFT', 'AVGO', 'HOOD', 'HIMS', 'BABA', 'SMCI'
]

async def analyze_options():
    """Run comprehensive options analysis"""
    db = SessionLocal()
    try:
        print("\n=== Starting Options Analysis ===")
        print(f"Analyzing {len(WATCH_SYMBOLS)} symbols...")
        
        # Clear old suggestions
        db.query(SmartOptionSuggestion).delete()
        print("Cleared previous suggestions from database")
        
        all_opportunities = []
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        async with httpx.AsyncClient() as http_client:
            for symbol in WATCH_SYMBOLS:
                try:
                    print(f"\nAnalyzing {symbol}...")
                    
                    # Get current price
                    ticker = yf.Ticker(symbol)
                    history = ticker.history(period="1d")
                    if history.empty:
                        print(f"No price data for {symbol}")
                        continue
                    current_price = history["Close"].iloc[-1]
                    print(f"Current price: ${current_price:.2f}")

                    # Get option chain expirations using the API
                    response = await http_client.get(f"${api_url}/options/{symbol}")
                    print(f"API Response Status: {response.status_code}")
                    print(f"API Response Body: {response.text[:200]}...")  # First 200 chars
                    if not response.is_success:
                        print(f"Failed to fetch options data for {symbol}")
                        continue

                    options_data = response.json()
                    
                    # Fix: Use the correct key for expirations
                    expirations = options_data.get('expirations', [])[:2]  # Get first two dates
                    if not expirations:
                        print(f"No expirations found for {symbol}")
                        continue
                    print(f"Analyzing expirations: {expirations}")

                    for expiration in expirations:
                        try:
                            print(f"\n  Expiration {expiration}:")
                            
                            # Get option chain for this expiration
                            response = await http_client.get(
                                f"${api_url}/options/{symbol}?expiration={expiration}"
                            )
                            if not response.is_success:
                                print(f"Failed to fetch chain for {symbol} {expiration}")
                                continue

                            chain_data = response.json()
                            
                            # Analyze both calls and puts
                            for opt_type in ['calls', 'puts']:
                                print(f"    {opt_type.upper()}:")
                                options = chain_data.get(opt_type, [])
                                if not options:
                                    print(f"      No {opt_type} data found")
                                    continue
                                
                                # Get strikes around current price
                                all_strikes = sorted(set(opt['strike'] for opt in options))
                                current_idx = min(range(len(all_strikes)), 
                                                   key=lambda i: abs(all_strikes[i]-current_price))
                                relevant_strikes = all_strikes[max(0, current_idx-2):current_idx+3]
                                
                                print(f"  Analyzing strikes: {relevant_strikes}")
                                
                                for strike in relevant_strikes:
                                    try:
                                        # Find option with this strike
                                        option = next(
                                            (opt for opt in options if opt['strike'] == strike),
                                            None
                                        )
                                        
                                        if not option:
                                            print(f"      No {opt_type} data for strike {strike}")
                                            continue

                                        # Calculate premium using bid/ask spread
                                        bid = float(option.get('bid', 0)) if option.get('bid') else None
                                        ask = float(option.get('ask', 0)) if option.get('ask') else None
                                        last_price = float(option.get('lastPrice', 0)) if option.get('lastPrice') else 0

                                        if bid is not None and ask is not None:
                                            premium = (bid + ask) / 2
                                        else:
                                            premium = last_price

                                        # Debugging output
                                        print(f"      Processing option: Strike={strike}, Type={opt_type}")
                                        print(f"      Raw option data: {option}")
                                        print(f"      Calculated values: Bid={bid}, Ask={ask}, Premium={premium}")

                                        # Calculate days to expiration
                                        exp_date = datetime.strptime(expiration, '%Y-%m-%d')
                                        days_to_exp = (exp_date - datetime.now()).days
                                        if days_to_exp <= 0:
                                            print(f"      Option expired for {strike} {opt_type}")
                                            continue
                                            
                                        T = days_to_exp / 365

                                        print(f"      Days to expiration: {days_to_exp}, T={T:.2f}")
                                        debugimp = float(option.get('impliedVolatility', 0))
                                        print(f" current_price: {current_price}, strike: {strike}, T: {T}, premium: {premium} debugimp: {debugimp} opt_type: {opt_type}")
                                        # Calculate EV
                                        ev_calc = calculate_ev(
                                            S=float(current_price),
                                            K=float(strike),
                                            T=T,
                                            r=0.05,
                                            sigma=float(option.get('impliedVolatility', 0)),
                                            option_type=opt_type,
                                            premium=premium
                                        )
                                        print(f"      EV calculation: {ev_calc}")
                                        
                                        if ev_calc['ev'] > 0:
                                            print(f"      ${strike} {opt_type}: EV=${ev_calc['ev']:.2f}")
                                            all_opportunities.append({
                                                'symbol': symbol,
                                                'strike': float(strike),
                                                'expiration': expiration,
                                                'option_type': opt_type[:-1],
                                                'stock_price': float(current_price),
                                                'ev': float(ev_calc['ev']),
                                                'probability': float(ev_calc['probability']),
                                                'delta': float(ev_calc['delta']),
                                                'max_gain': float(ev_calc['max_gain']),
                                                'max_loss': float(ev_calc['max_loss']),
                                                'breakeven': float(ev_calc['breakeven']),
                                                'iv': float(option.get('impliedVolatility', 0)) * 100,
                                            })
                                            
                                    except Exception as e:
                                        print(f"      Error analyzing {strike} {opt_type}: {str(e)}")
                                        continue
                                        
                        except Exception as e:
                            print(f"Error processing expiration {expiration}: {str(e)}")
                            continue
                            
                except Exception as e:
                    print(f"Error analyzing {symbol}: {str(e)}")
                    print(f"Detailed error: {traceback.format_exc()}")
                    continue

        print(f"\nFound {len(all_opportunities)} positive EV opportunities")
        
        # Ensure diverse stock selection
        diverse_opportunities = []
        seen_symbols = set()

        min_diverse_count = 4
        num_opportunities = 6

        # Sort all opportunities by EV
        sorted_opportunities = sorted(all_opportunities, key=lambda x: x['ev'], reverse=True)

        # Step 1: Add one opportunity per stock until we reach the minimum diversity requirement
        for opp in sorted_opportunities:
            if len(seen_symbols) < min_diverse_count and opp['symbol'] not in seen_symbols:
                diverse_opportunities.append(opp)
                seen_symbols.add(opp['symbol'])

        # Step 2: Fill the remaining slots with the highest EV opportunities
        for opp in sorted_opportunities:
            if len(diverse_opportunities) >= num_opportunities:
                break
            if opp not in diverse_opportunities:
                diverse_opportunities.append(opp)

        # Get market context for GPT
        spy_ticker = yf.Ticker("SPY")
        vix_ticker = yf.Ticker("^VIX")
        spy_price = spy_ticker.history(period="1d")["Close"].iloc[-1]
        spy_prev = spy_ticker.history(period="2d")["Close"].iloc[-2]
        spy_change = ((spy_price - spy_prev) / spy_prev) * 100
        vix_price = vix_ticker.history(period="1d")["Close"].iloc[-1]
        
        print(f"\nGetting market context...")
        print(f"SPY: ${spy_price:.2f} ({spy_change:.1f}%), VIX: {vix_price:.1f}")
        
        # Generate GPT analysis for opportunities
        print("\nGenerating GPT analysis for top opportunities...")
        
        market_context = f"""Current market context:
- SPY trading at ${spy_price:.2f} ({spy_change:.1f}% today)
- VIX at {vix_price:.1f}
"""
        
        for opp in diverse_opportunities:
            try:
                prompt = f"""Analyze this high-EV options trade opportunity as OptiVue AI's featured pick of the week:

{market_context}

Trade details:
- Symbol: {opp['symbol']}
- Type: {opp['option_type'].upper()}
- Strike: ${opp['strike']}
- Expiration: {opp['expiration']}
- Current stock price: ${opp['stock_price']:.2f}
- Expected Value (EV): ${opp['ev']:.2f}
- Probability ITM: {opp['probability']*100:.1f}%
- Delta: {opp['delta']:.2f}
- Max gain: ${opp['max_gain']:.2f}
- Max loss: ${opp['max_loss']:.2f}
- Breakeven: ${opp['breakeven']:.2f}
- Implied Volatility: {opp['iv']:.1f}%

Provide a confident, data-driven analysis in 2-3 sentences explaining why this is a top-rated opportunity. Include:
1. Statistical edge (EV, probability, IV analysis)
2. Recent market catalysts or news
3. Clear price targets and risk levels
Use a bold, assertive tone - this is one of our highest-conviction trades of the week.
"""
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": """You are OptiVue AI's head options strategist.
                         Your analysis is highly respected for being bold, precise, and backed by data.
                         Focus on concrete numbers and specific catalysts."""},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=250
                )
                
                opp['gpt_analysis'] = response.choices[0].message.content
                print(f"\nGPT Analysis for {opp['symbol']} {opp['strike']} {opp['option_type']}:")
                print(opp['gpt_analysis'])
                
            except Exception as e:
                print(f"Error getting GPT analysis for {opp['symbol']}: {str(e)}")
                opp['gpt_analysis'] = "Analysis unavailable"

        # Store in database
        for opp in diverse_opportunities:
            suggestion = SmartOptionSuggestion(**opp)
            db.add(suggestion)
        
        db.commit()
        print("\n=== Analysis complete! ===")
        print(f"Successfully stored {len(diverse_opportunities)} suggestions in database")
        
    except Exception as e:
        print(f"\nError in analysis job: {str(e)}")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()