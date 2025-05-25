import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Sparklines, SparklinesLine } from "react-sparklines";
import OptionPriceChart from '../components/OptionPriceChart';

export default function Watchlist() {
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [view, setView] = useState("stocks");
  const [sortOption, setSortOption] = useState("alphabetical");
  const [stockDataMap, setStockDataMap] = useState({});
  const [timeInterval, setTimeInterval] = useState("1d"); 
  const [selectedOption, setSelectedOption] = useState(null);
  const navigate = useNavigate();

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setFirebaseUid(user.uid);
    });
    return () => unsub();
  }, []);

  // Fetch watchlist
  useEffect(() => {
    if (firebaseUid) {
      fetch(`http://127.0.0.1:8000/get_watchlist/${firebaseUid}?type=${view}`)
        .then((res) => res.json())
        .then(setWatchlist)
        .catch(console.error);
    }
  }, [firebaseUid, view]);

  // Fetch stock data for sparklines
  useEffect(() => {
    if (view === "stocks" && watchlist.length > 0) {
      const fetchStockData = async () => {
        const newStockData = {};
        for (const item of watchlist) {
          try {
            const res = await fetch(
              `http://127.0.0.1:8000/stock_sparkline/${item.symbol}?interval=${timeInterval}`
            );
            if (res.ok) {
              const data = await res.json();
              newStockData[item.symbol] = data;
            }
          } catch (err) {
            console.error(`Error fetching data for ${item.symbol}:`, err);
          }
        }
        setStockDataMap(newStockData);
      };
      fetchStockData();
    }
  }, [watchlist, view, timeInterval]); // Add timeInterval to dependencies

  const handleRemove = async (item) => {
    try {
        const response = await fetch('http://127.0.0.1:8000/remove_from_watchlist/', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firebase_uid: firebaseUid,
                symbol: item.symbol,
                option_type: item.option_type,
                strike: item.strike,
                expiration: item.expiration
            })
        });

        if (!response.ok) {
            throw new Error('Failed to remove item');
        }

        // Update state more precisely
        setWatchlist(prevList => 
            prevList.filter(listItem => 
                !(listItem.symbol === item.symbol && 
                  listItem.option_type === item.option_type &&
                  listItem.strike === item.strike &&
                  listItem.expiration === item.expiration)
            )
        );
        
    } catch (error) {
        console.error('Error removing item:', error);
    }
};

  // Sort watchlist based on selected option
  const sortedWatchlist = [...watchlist].sort((a, b) => {
    if (view !== "stocks") return 0;
    
    const aData = stockDataMap[a.symbol] || {};
    const bData = stockDataMap[b.symbol] || {};

    switch (sortOption) {
      case "alphabetical":
        return a.symbol.localeCompare(b.symbol);
      case "price":
        return (bData.price || 0) - (aData.price || 0);
      case "gainers":
        return (bData.changePercent || 0) - (aData.changePercent || 0);
      case "losers":
        return (aData.changePercent || 0) - (bData.changePercent || 0);
      default:
        return 0;
    }
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2>⭐ My Watchlist</h2>
      
      {/* View Toggle */}
      <div style={{ marginBottom: "20px" }}>
        <label>
          <input
            type="radio"
            checked={view === "stocks"}
            onChange={() => setView("stocks")}
          />
          Stocks
        </label>
        <label style={{ marginLeft: "15px" }}>
          <input
            type="radio"
            checked={view === "options"}
            onChange={() => setView("options")}
          />
          Options
        </label>
      </div>

      {/* Sort Options and Interval Selector (only for stocks view) */}
      {view === "stocks" && (
        <div style={{ marginBottom: "20px", display: "flex", gap: "20px" }}>
          <label>
            Sort By:{" "}
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              style={{ padding: "5px" }}
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="price">Price (High to Low)</option>
              <option value="gainers">Top Gainers</option>
              <option value="losers">Top Losers</option>
            </select>
          </label>

          <label>
            Chart Range:{" "}
            <select
              value={timeInterval}
              onChange={(e) => setTimeInterval(e.target.value)}
              style={{ padding: "5px" }}
            >
              <option value="1d">1 Day</option>
              <option value="5d">5 Days</option>
              <option value="1mo">1 Month</option>
              <option value="3mo">3 Months</option>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
            </select>
          </label>
        </div>
      )}

      {/* Watchlist Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            <th>Symbol</th>
            {view === "stocks" && (
              <>
                <th>Chart</th>
                <th>Price</th>
                <th>Change ({timeInterval})</th>
              </>
            )}
            {view === "options" && (
              <>
                <th>Strike</th>
                <th>Expiration</th>
                <th>Type</th>
                <th>Chart</th>
              </>
            )}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedWatchlist.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
              <td
                style={{ 
                  cursor: "pointer", 
                  color: "#1976d2",
                  padding: "10px 0"
                }}
                onClick={() => {
                  if (view === "options") {
                    navigate(`/search?symbol=${item.symbol}&showOptions=true&strike=${item.strike}&type=${item.option_type}&expiration=${item.expiration}`);
                  } else {
                    navigate(`/search?symbol=${item.symbol}`);
                  }
                }}
              >
                {item.symbol}
              </td>
              
              {view === "stocks" && (
                <>
                  <td style={{ width: "120px" }}>
                    {stockDataMap[item.symbol]?.sparkline && (
                      <div 
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/search?symbol=${item.symbol}`)}
                      >
                        <Sparklines 
                          data={stockDataMap[item.symbol].sparkline} 
                          width={100} 
                          height={30}
                        >
                          <SparklinesLine 
                            color={stockDataMap[item.symbol].change >= 0 ? "#4caf50" : "#f44336"} 
                          />
                        </Sparklines>
                      </div>
                    )}
                  </td>
                  <td>
                    ${stockDataMap[item.symbol]?.price?.toFixed(2) || "..."}
                  </td>
                  <td style={{ 
                    color: stockDataMap[item.symbol]?.change >= 0 ? "#4caf50" : "#f44336"
                  }}>
                    {stockDataMap[item.symbol]?.change ? (
                      <>
                        {stockDataMap[item.symbol].change >= 0 ? "+" : ""}
                        {stockDataMap[item.symbol].change.toFixed(2)} (
                        {stockDataMap[item.symbol].changePercent.toFixed(2)}%)
                      </>
                    ) : "..."}
                  </td>
                </>
              )}
              
              {view === "options" && (
                <>
                  <td>{item.strike}</td>
                  <td>{item.expiration}</td>
                  <td>{item.option_type}</td>
                  <td>
                    <button 
                      onClick={() => setSelectedOption(item)}
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#1976d2",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      View Chart
                    </button>
                  </td>
                </>
              )}
              
              <td>
                <button 
                  onClick={() => handleRemove(item)}
                  style={{
                    padding: "5px 10px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {view === "options" && selectedOption && (
        <div style={{ marginTop: "20px" }}>
          <OptionPriceChart
            watchlistId={selectedOption.id}  // Changed from contract_symbol
            ticker={selectedOption.symbol}
            strike={selectedOption.strike}
            expiration={selectedOption.expiration}
            type={selectedOption.option_type}
          />
        </div>
      )}
    </div>
  );
}