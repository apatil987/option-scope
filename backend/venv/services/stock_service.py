import yfinance as yf

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
