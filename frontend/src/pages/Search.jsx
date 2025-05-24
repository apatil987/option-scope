import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TradingViewChart from '../components/TradingViewChart';
import { auth } from '../firebase';

export default function Search() {
  const [searchParams] = useSearchParams();
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState(null);
  const [optionData, setOptionData] = useState(null);
  const [selectedExpiration, setSelectedExpiration] = useState('');
  const [optionType, setOptionType] = useState('calls');
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [user, setUser] = useState(null);

  // Separate watchlists for stocks and options
  const [stockWatchlist, setStockWatchlist] = useState([]);
  const [optionWatchlist, setOptionWatchlist] = useState([]);
  const [isStockInWatchlist, setIsStockInWatchlist] = useState(false);

  const [filters, setFilters] = useState({
    minStrike: '',
    maxStrike: '',
    minVolume: '',
    maxIV: '',
    itmOnly: false
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  // Fetch stock watchlist when stockData changes
  useEffect(() => {
    const user = auth.currentUser;
    if (user && stockData) {
      fetch(`http://127.0.0.1:8000/get_watchlist/${user.uid}?type=stocks`)
        .then(res => res.json())
        .then(data => {
          setStockWatchlist(data);
          setIsStockInWatchlist(
            data.some(item => item.symbol === stockData.symbol)
          );
        })
        .catch(console.error);
    }
  }, [stockData]);

  // Fetch option watchlist when options are shown
  useEffect(() => {
    const user = auth.currentUser;
    if (user && stockData && showOptions) {
      fetch(`http://127.0.0.1:8000/get_watchlist/${user.uid}?type=options`)
        .then(res => res.json())
        .then(data => setOptionWatchlist(data))
        .catch(console.error);
    }
  }, [stockData, showOptions, selectedExpiration, optionType]);

  useEffect(() => {
    if (showOptions && stockData) {
      fetchOptionData();
    }
  }, [selectedExpiration, optionType]);

  // Handle URL query parameter
  useEffect(() => {
    const symbolFromUrl = searchParams.get("symbol");
    if (symbolFromUrl) {
      setSymbol(symbolFromUrl);
      fetchStockData(symbolFromUrl);
    }
  }, [searchParams]);

  // Modified fetchStockData to handle both URL params and button click
  const fetchStockData = async (symbolToFetch = null) => {
    try {
      const searchSymbol = symbolToFetch || symbol; // Use parameter or state
      if (!searchSymbol) return; // Guard against empty searches

      const response = await fetch(`http://127.0.0.1:8000/stocks/${searchSymbol.toUpperCase()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Invalid ticker');
      }
      setError('');
      const data = await response.json();
      setStockData(data);
      setOptionData(null);
      setShowOptions(false);
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error('Error fetching stock data:', error);
    }
  };

  const fetchOptionData = async () => {
    if (!stockData) {
      alert("Please search for a valid stock before viewing options.");
      return;
    }
    try {
      const response = await fetch(`http://127.0.0.1:8000/options/${symbol.toUpperCase()}?expiration=${selectedExpiration}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch options data');
      }
      setError('');
      const data = await response.json();
      setOptionData(data);
      setShowOptions(true);

      // Set the default expiration date if not already set
      if (!selectedExpiration && data.expirations.length > 0) {
        setSelectedExpiration(data.expirations[0]);
      }
    } catch (error) {
      setError(`Error: ${error.message}`);
      setOptionData(null);
      setShowOptions(false);
    }
  };

  // Helper for options
  const isOptionInWatchlist = (opt, type) => {
    return optionWatchlist.some(
      item =>
        item.symbol === stockData.symbol &&
        item.strike === opt.strike &&
        item.expiration === selectedExpiration &&
        item.option_type === type
    );
  };

  const handleAddToWatchlist = async (opt, type) => {
    const user = auth.currentUser;
    if (!user) return alert("Login first");

    const payload = {
      firebase_uid: user.uid,
      symbol: symbol.toUpperCase(),
      strike: opt.strike,
      expiration: selectedExpiration,
      option_type: type,
    };

    const res = await fetch("http://127.0.0.1:8000/add_to_watchlist/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Added ✅");
    } else if (res.status === 409) {
      alert("Already in watchlist ❌");
    } else {
      alert("Failed to add ❌");
    }

    // After success refetch option watchlist
    fetch(`http://127.0.0.1:8000/get_watchlist/${auth.currentUser.uid}?type=options`)
      .then(res => res.json())
      .then(setOptionWatchlist)
      .catch(console.error);
  };

  const handleRemoveFromWatchlist = async (opt, type) => {
    const payload = {
      firebase_uid: auth.currentUser.uid,
      symbol: stockData.symbol,
      strike: opt?.strike,
      expiration: selectedExpiration,
      option_type: type,
    };
    await fetch("http://127.0.0.1:8000/remove_from_watchlist/", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    // Refetch option watchlist
    fetch(`http://127.0.0.1:8000/get_watchlist/${auth.currentUser.uid}?type=options`)
      .then(res => res.json())
      .then(setOptionWatchlist)
      .catch(console.error);
  };

  // For stocks
  const handleAddStock = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Login first");

    await fetch("http://127.0.0.1:8000/add_to_watchlist/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: user.uid,
        symbol: symbol.toUpperCase(),
      }),
    });

    alert("Stock added to watchlist ✅");

    fetch(`http://127.0.0.1:8000/get_watchlist/${auth.currentUser.uid}?type=stocks`)
      .then(res => res.json())
      .then(data => {
        setStockWatchlist(data);
        setIsStockInWatchlist(true);
      })
      .catch(console.error);
  };

  const handleRemoveStock = async () => {
    const payload = {
      firebase_uid: auth.currentUser.uid,
      symbol: stockData.symbol,
    };
    await fetch("http://127.0.0.1:8000/remove_from_watchlist/", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetch(`http://127.0.0.1:8000/get_watchlist/${auth.currentUser.uid}?type=stocks`)
      .then(res => res.json())
      .then(data => {
        setStockWatchlist(data);
        setIsStockInWatchlist(false);
      })
      .catch(console.error);
  };

  const applyFilters = (options) => {
    return options.filter(opt => {
      const strike = opt.strike;
      const volume = opt.volume;
      const iv = opt.impliedVolatility * 100;
      const inTheMoney = opt.inTheMoney;
      return (!filters.minStrike || strike >= parseFloat(filters.minStrike)) &&
             (!filters.maxStrike || strike <= parseFloat(filters.maxStrike)) &&
             (!filters.minVolume || volume >= parseFloat(filters.minVolume)) &&
             (!filters.maxIV || iv <= parseFloat(filters.maxIV)) &&
             (!filters.itmOnly || inTheMoney);
    });
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h1>OptiVue: Stock Lookup</h1>
      <input 
        value={symbol} 
        onChange={e => setSymbol(e.target.value)} 
        placeholder="Ticker" 
      />
      <button onClick={() => fetchStockData()}>Search</button>
      <button onClick={() => setShowChart(!showChart)}>
        {showChart ? 'Hide Chart' : 'Show Chart'}
      </button>
      
      {stockData && (
        <div>
          {/* Always show add/remove stock button */}
          {isStockInWatchlist ? (
            <button onClick={handleRemoveStock}>❌ Remove Stock from Watchlist</button>
          ) : (
            <button onClick={handleAddStock}>⭐ Add Stock to Watchlist</button>
          )}
        </div>
      )}

      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      {showChart && symbol && (
        <div style={{ marginTop: '20px' }}>
          <TradingViewChart symbol={symbol.toUpperCase()} />
        </div>
      )}

      {stockData && (
        <div style={{ marginTop: '20px' }}>
          <h2>{stockData.symbol}</h2>
          <p>Current Price: ${stockData.current_price}</p>
          <p>Previous Close: ${stockData.previous_close}</p>
          <p>Change: ${stockData.price_change} ({stockData.percent_change.toFixed(2)}%)</p>
          <p>Volume: {stockData.volume.toLocaleString()}</p>
          <button onClick={() => { fetchOptionData(); setShowOptions(true); }}>View Options</button>

          {showOptions && optionData && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <label>Strike Min: <input type="number" value={filters.minStrike} onChange={e => setFilters({ ...filters, minStrike: e.target.value })} /></label>
                <label>Strike Max: <input type="number" value={filters.maxStrike} onChange={e => setFilters({ ...filters, maxStrike: e.target.value })} /></label>
                <label>Volume &gt; <input type="number" value={filters.minVolume} onChange={e => setFilters({ ...filters, minVolume: e.target.value })} /></label>
                <label>IV &lt; <input type="number" value={filters.maxIV} onChange={e => setFilters({ ...filters, maxIV: e.target.value })} /></label>
                <label><input type="checkbox" checked={filters.itmOnly} onChange={e => setFilters({ ...filters, itmOnly: e.target.checked })} /> ITM Only</label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Expiration:
                  <select 
                    value={selectedExpiration} 
                    onChange={e => setSelectedExpiration(e.target.value)}
                  >
                    {optionData?.expirations.map(exp => (
                      <option key={exp} value={exp}>{exp}</option>
                    ))}
                  </select>
                </label>
                <label style={{ marginLeft: '10px' }}>
                  Type:
                  <select value={optionType} onChange={e => setOptionType(e.target.value)}>
                    <option value="calls">Calls</option>
                    <option value="puts">Puts</option>
                  </select>
                </label>
              </div>

              <h3>{optionType === 'calls' ? 'Calls' : 'Puts'} Expiring {selectedExpiration}</h3>
              <table style={{ margin: 'auto', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th>Strike</th><th>Bid</th><th>Ask</th><th>IV</th><th>OI</th><th>Volume</th><th>ITM</th><th>+Watch</th>
                  </tr>
                </thead>
                <tbody>
                  {applyFilters(optionData[optionType]).map((opt, idx) => (
                    <tr key={idx}>
                      <td>{opt.strike}</td>
                      <td>{opt.bid}</td>
                      <td>{opt.ask}</td>
                      <td>{(opt.impliedVolatility * 100).toFixed(2)}%</td>
                      <td>{opt.openInterest}</td>
                      <td>{opt.volume}</td>
                      <td>{opt.inTheMoney ? '✅' : ''}</td>
                      <td>
                        {isOptionInWatchlist(opt, optionType) ? (
                          <button onClick={() => handleRemoveFromWatchlist(opt, optionType)}>
                            ❌ Remove
                          </button>
                        ) : (
                          <button onClick={() => handleAddToWatchlist(opt, optionType)}>
                            ⭐ Add
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
