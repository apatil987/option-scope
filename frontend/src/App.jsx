import React, { useState } from 'react';
import { useEffect } from 'react';

function App() {
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState(null);
  const [optionData, setOptionData] = useState(null);
  const [selectedExpiration, setSelectedExpiration] = useState('');
  const [optionType, setOptionType] = useState('calls');
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    minStrike: '',
    maxStrike: '',
    minVolume: '',
    maxIV: '',
    itmOnly: false
  });

  useEffect(() => {
    if (showOptions && stockData) {
      fetchOptionData();
    }
    }, [selectedExpiration, optionType]);

  const fetchStockData = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/stocks/${symbol.toUpperCase()}`);
      if (!response.ok) {
        setError(`Error: ${error.message}`);
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Invalid ticker');
      }
      setError('');
      const data = await response.json();
      setStockData(data);
      setOptionData(null);
      setShowOptions(false);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  const fetchOptionData = async () => {
    if (!stockData) {
      alert("Please search for a valid stock before viewing options.");
      setError(`Error: ${error.message}`);
      return;
    }
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/options/${symbol.toUpperCase()}?expiration=${selectedExpiration}`
      );
      if (!response.ok) {
        setError(`Error: ${error.message}`);
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch options data');
      }
      setError('');
      const data = await response.json();
      setOptionData(data);
      setShowOptions(true);
    } catch (error) {
      console.error('Error fetching option data:', error);
      setOptionData(null);
      setShowOptions(false);
      alert(`Error: ${error.message}`);
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
      <h1>OptionScope: Stock Lookup</h1>
      <input 
        value={symbol} 
        onChange={e => setSymbol(e.target.value)} 
        placeholder="Ticker" 
      />
      <button onClick={fetchStockData}>Search</button>
      {error && (
      <div style={{ color: 'red', marginTop: '10px' }}>
        {error}
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
                <label>
                  Strike Min: <input type="number" value={filters.minStrike} onChange={e => setFilters({ ...filters, minStrike: e.target.value })} />
                </label>
                <label>
                  Strike Max: <input type="number" value={filters.maxStrike} onChange={e => setFilters({ ...filters, maxStrike: e.target.value })} />
                </label>
                <label>
                  Volume &gt; <input type="number" value={filters.minVolume} onChange={e => setFilters({ ...filters, minVolume: e.target.value })} />
                </label>
                <label>
                  IV &lt; <input type="number" value={filters.maxIV} onChange={e => setFilters({ ...filters, maxIV: e.target.value })} />
                </label>
                <label>
                  <input type="checkbox" checked={filters.itmOnly} onChange={e => setFilters({ ...filters, itmOnly: e.target.checked })} /> ITM Only
                </label>
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
                    <th style={{ padding: '8px' }}>Strike</th>
                    <th style={{ padding: '8px' }}>Bid</th>
                    <th style={{ padding: '8px' }}>Ask</th>
                    <th style={{ padding: '8px' }}>IV</th>
                    <th style={{ padding: '8px' }}>OI</th>
                    <th style={{ padding: '8px' }}>Volume</th>
                    <th style={{ padding: '8px' }}>ITM</th>
                  </tr>
                </thead>
                <tbody>
                  {applyFilters(optionData[optionType]).map((opt, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '8px' }}>{opt.strike}</td>
                      <td style={{ padding: '8px' }}>{opt.bid}</td>
                      <td style={{ padding: '8px' }}>{opt.ask}</td>
                      <td style={{ padding: '8px' }}>{(opt.impliedVolatility * 100).toFixed(2)}%</td>
                      <td style={{ padding: '8px' }}>{opt.openInterest}</td>
                      <td style={{ padding: '8px' }}>{opt.volume}</td>
                      <td style={{ padding: '8px' }}>{opt.inTheMoney ? '✅' : ''}</td>
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

export default App;
