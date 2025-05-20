import { useState } from "react";

function App() {
  const [ticker, setTicker] = useState("");
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState("");

  const fetchStock = async () => {
    if (!ticker) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/stocks/${ticker}`);
      if (!res.ok) throw new Error("Invalid ticker");
      const data = await res.json();
      setStockData(data);
      setError("");
    } catch (err) {
      setStockData(null);
      setError("Invalid ticker or failed to fetch.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4">OptionScope: Stock Lookup</h1>

      <div className="flex gap-2">
        <input
          className="border px-3 py-2 rounded-md"
          type="text"
          placeholder="Enter ticker (e.g. AAPL)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        />
        <button
          onClick={fetchStock}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {stockData && (
        <div className="bg-white mt-6 p-6 rounded-lg shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold mb-2">{stockData.symbol}</h2>
          <p>Current Price: ${stockData.current_price}</p>
          <p>Previous Close: ${stockData.previous_close}</p>
          <p>Change: ${stockData.price_change} ({stockData.percent_change}%)</p>
          <p>Volume: {stockData.volume?.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default App;
