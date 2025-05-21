import yfinance as yf
import math
from fastapi import Query

def get_stock_quote(ticker: str):
    stock = yf.Ticker(ticker)
    data = stock.info

    return {
        "symbol": ticker.upper(),
        "current_price": data.get("regularMarketPrice"),
        "previous_close": data.get("previousClose"),
        "price_change": round(data.get("regularMarketPrice", 0) - data.get("previousClose", 0), 2),
        "percent_change": round(
            ((data.get("regularMarketPrice", 0) - data.get("previousClose", 0)) / data.get("previousClose", 1)) * 100,
            2
        ),
        "volume": data.get("volume")
    }


def get_option_chain(ticker: str, expiration: str = None):
    stock = yf.Ticker(ticker)
    expirations = stock.options
    if not expirations:
        raise ValueError("No expirations found")

    exp = expiration or expirations[0]
    if exp not in expirations:
        raise ValueError("Invalid expiration")

    opt_chain = stock.option_chain(exp)

    def safe(val):
        return None if isinstance(val, float) and (math.isnan(val) or math.isinf(val)) else val

    def serialize(option):
        return {
            "contractSymbol": option.contractSymbol,
            "strike": safe(option.strike),
            "lastPrice": safe(option.lastPrice),
            "bid": safe(option.bid),
            "ask": safe(option.ask),
            "volume": safe(option.volume),
            "openInterest": safe(option.openInterest),
            "impliedVolatility": safe(option.impliedVolatility),
            "inTheMoney": option.inTheMoney,
        }

    return {
        "symbol": ticker.upper(),
        "expiration": exp,
        "expirations": expirations,
        "calls": [serialize(o) for _, o in opt_chain.calls.iterrows()],
        "puts": [serialize(o) for _, o in opt_chain.puts.iterrows()]
    }