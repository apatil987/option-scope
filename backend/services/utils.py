from math import log, sqrt
from scipy.stats import norm

def calculate_ev(S: float, K: float, T: float, r: float, sigma: float, 
                option_type: str, premium: float, price_itm: float = None):
    """Calculate Expected Value (EV) for an option trade"""
    try:
        print(f"\nDEBUG calculate_ev inputs:")
        print(f"S={S}, K={K}, T={T}, r={r}, sigma={sigma}")
        print(f"option_type={option_type}, premium={premium}")

        if T <= 0 or sigma <= 0:
            print("Invalid T or sigma")
            return None

        # Calculate d1 and d2
        d1 = (log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * sqrt(T))
        d2 = d1 - sigma * sqrt(T)
        
        print(f"d1={d1}, d2={d2}")

        # Handle calls and puts differently
        if option_type.lower() in ['calls', 'call']:
            p_win = norm.cdf(d2)        # probability of expiring ITM
            delta = norm.cdf(d1)        # option's delta
            breakeven = K + premium
            est_price = price_itm if price_itm else K + (sigma * S)  # estimate ITM price
            profit_itm = max(0, est_price - K - premium)
        elif option_type.lower() in ['puts', 'put']:
            p_win = norm.cdf(-d2)
            delta = -norm.cdf(-d1)
            breakeven = K - premium
            est_price = price_itm if price_itm else K - (sigma * S)
            profit_itm = max(0, K - est_price - premium)
        else:
            print(f"Invalid option type: {option_type}")
            return None

        loss = premium
        ev = (p_win * profit_itm) - ((1 - p_win) * loss)

        result = {
            "ev": round(ev, 4),
            "probability": round(p_win, 4),
            "delta": round(delta, 4),
            "max_gain": round(profit_itm, 4),
            "max_loss": round(loss, 4),
            "breakeven": round(breakeven, 4),
        }
        
        print(f"EV calculation result: {result}")
        return result

    except Exception as e:
        print(f"Error in calculate_ev: {str(e)}")
        return None