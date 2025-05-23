import React, { useState, useEffect } from 'react';
import TradingViewChart from '../components/TradingViewChart';
import { auth } from '../firebase';

export default function Search() {
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState(null);
  const [optionData, setOptionData] = useState(null);
  const [selectedExpiration, setSelectedExpiration] = useState('');
  const [optionType, setOptionType] = useState('calls');
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [user, setUser] = useState(null);

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

  useEffect(() => {
    if (showOptions && stockData) {
      fetchOptionData();
    }
  }, [selectedExpiration, optionType]);

  const fetchStockData = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/stocks/${symbol.toUpperCase()}`);
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
    } catch (error) {
      setError(`Error: ${error.message}`);
      setOptionData(null);
      setShowOptions(false);
    }
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
      if (data.message === "Already in watchlist") {
        alert("Already added ❌");
      } 
      else {
        alert("Added ✅");
      }
    }  else {
      alert("Error adding to watchlist ❌");
    }
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
      <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Ticker" />
      <button onClick={fetchStockData}>Search</button>
      <button onClick={() => setShowChart(!showChart)}>
        {showChart ? 'Hide Chart' : 'Show Chart'}
      </button>
      
      {stockData && !showOptions && (
        <button
          onClick={async () => {
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
          }}
        >
          ⭐ Add Stock to Watchlist
        </button>
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
                  <select value={selectedExpiration} onChange={e => setSelectedExpiration(e.target.value)}>
                    {optionData.expirations.map(exp => (
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
                      <td><button onClick={() => handleAddToWatchlist(opt, optionType)}>⭐</button></td>
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
