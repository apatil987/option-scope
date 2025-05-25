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
  const [isLoading, setIsLoading] = useState(false); // New loading state

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
    const showOptionsParam = searchParams.get("showOptions");
    const strikeParam = searchParams.get("strike");
    const typeParam = searchParams.get("type");
    const expirationParam = searchParams.get("expiration");

    console.log('URL params:', { 
      symbolFromUrl, 
      showOptionsParam, 
      strikeParam, 
      typeParam, 
      expirationParam 
    });

    const loadData = async () => {
      if (symbolFromUrl) {
        try {
          setSymbol(symbolFromUrl);
          await fetchStockData(symbolFromUrl);
          
          if (showOptionsParam === "true") {
            // Set all option-related states before fetching options
            setShowOptions(true);
            setOptionType(typeParam === "puts" ? "puts" : "calls");
            setSelectedExpiration(expirationParam); // Set this before fetchOptionData
            setFilters(prev => ({
              ...prev,
              minStrike: strikeParam || '',
              maxStrike: ''
            }));

            // Modify fetchOptionData to use the URL expiration
            const response = await fetch(
              `http://127.0.0.1:8000/options/${symbolFromUrl.toUpperCase()}?expiration=${expirationParam || ''}`
            );
            
            if (!response.ok) {
              throw new Error('Failed to fetch options data');
            }

            const data = await response.json();
            setOptionData(data);
          }
        } catch (error) {
          console.error("Error in loadData:", error);
          setError(error.message);
        }
      }
    };

    loadData();
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

  // Update the fetchOptionData function
  const fetchOptionData = async (symbolToUse = symbol, expirationToUse = selectedExpiration) => {
    if (!symbolToUse) {
      console.error('No symbol provided for options fetch');
      return;
    }

    setIsLoading(true);
    try {
      const url = `http://127.0.0.1:8000/options/${symbolToUse.toUpperCase()}?expiration=${expirationToUse || ''}`;
      console.log('Fetching from URL:', url); // Debug log

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch options data');
      }

      const data = await response.json();
      console.log('Received options data:', data); // Debug log

      setOptionData(data);
      setShowOptions(true);

      // Set the default expiration date if needed
      if (!selectedExpiration && data.expirations && data.expirations.length > 0) {
        setSelectedExpiration(data.expirations[0]);
      }
    } catch (error) {
      console.error('Options fetch error:', error); // Debug log
      setError(`Error: ${error.message}`);
      setOptionData(null);
      setShowOptions(false);
    } finally {
      setIsLoading(false);
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
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '30px'
      }}>
        <h1 style={{ 
          margin: '0',
          fontSize: '24px',
          color: '#1a1a1a'
        }}>
          OptiVue: Stock Lookup
        </h1>
        <div style={{
          display: 'flex',
          gap: '10px',
          flex: 1
        }}>
          <input 
            value={symbol} 
            onChange={e => setSymbol(e.target.value)} 
            placeholder="Enter ticker symbol..." 
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              width: '200px'
            }}
          />
          <button 
            onClick={() => fetchStockData()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Search
          </button>
          <button 
            onClick={() => setShowChart(!showChart)}
            style={{
              padding: '8px 16px',
              backgroundColor: showChart ? '#FF3B30' : '#34C759',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          color: '#FF3B30',
          backgroundColor: '#FFE5E5',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {stockData && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{ margin: '0', fontSize: '28px' }}>{stockData.symbol}</h2>
              <div style={{ 
                fontSize: '24px',
                fontWeight: '500',
                marginTop: '8px'
              }}>
                ${stockData.current_price}
                <span style={{ 
                  color: stockData.price_change >= 0 ? '#34C759' : '#FF3B30',
                  fontSize: '16px',
                  marginLeft: '12px'
                }}>
                  {stockData.price_change >= 0 ? '↑' : '↓'} ${Math.abs(stockData.price_change)} ({stockData.percent_change.toFixed(2)}%)
                </span>
              </div>
            </div>
            {isStockInWatchlist ? (
              <button 
                onClick={handleRemoveStock}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FF3B30',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ❌ Remove from Watchlist
              </button>
            ) : (
              <button 
                onClick={handleAddStock}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#34C759',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ⭐ Add to Watchlist
              </button>
            )}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', fontSize: '14px' }}>Previous Close</div>
              <div style={{ fontSize: '18px', fontWeight: '500' }}>${stockData.previous_close}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', fontSize: '14px' }}>Volume</div>
              <div style={{ fontSize: '18px', fontWeight: '500' }}>{stockData.volume.toLocaleString()}</div>
            </div>
          </div>

          <button 
            onClick={() => { fetchOptionData(); setShowOptions(true); }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            View Options Chain
          </button>
        </div>
      )}

      {showChart && symbol && (
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <TradingViewChart symbol={symbol.toUpperCase()} />
        </div>
      )}

      {showOptions && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading options data...</div>
          ) : optionData && optionData[optionType] ? (
            <>
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '20px',
                marginBottom: '24px'
              }}>
                <select 
                  value={selectedExpiration} 
                  onChange={e => setSelectedExpiration(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                >
                  {optionData?.expirations.map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>

                <select 
                  value={optionType} 
                  onChange={e => setOptionType(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                >
                  <option value="calls">Calls</option>
                  <option value="puts">Puts</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px',
                marginBottom: '24px'
              }}>
                <input
                  type="number"
                  placeholder="Min Strike"
                  value={filters.minStrike}
                  onChange={e => setFilters({ ...filters, minStrike: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="number"
                  placeholder="Max Strike"
                  value={filters.maxStrike}
                  onChange={e => setFilters({ ...filters, maxStrike: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="number"
                  placeholder="Min Volume"
                  value={filters.minVolume}
                  onChange={e => setFilters({ ...filters, minVolume: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="number"
                  placeholder="Max IV %"
                  value={filters.maxIV}
                  onChange={e => setFilters({ ...filters, maxIV: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <input
                    type="checkbox"
                    checked={filters.itmOnly}
                    onChange={e => setFilters({ ...filters, itmOnly: e.target.checked })}
                  />
                  ITM Only
                </label>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '0',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f7' }}>
                      <th style={tableHeaderStyle}>Strike</th>
                      <th style={tableHeaderStyle}>Bid</th>
                      <th style={tableHeaderStyle}>Ask</th>
                      <th style={tableHeaderStyle}>IV</th>
                      <th style={tableHeaderStyle}>OI</th>
                      <th style={tableHeaderStyle}>Volume</th>
                      <th style={tableHeaderStyle}>ITM</th>
                      <th style={tableHeaderStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionData[optionType] && applyFilters(optionData[optionType]).map((opt, idx) => (
                      <tr key={idx} style={{
                        backgroundColor: idx % 2 === 0 ? 'white' : '#f9f9f9'
                      }}>
                        <td style={tableCellStyle}>${opt.strike}</td>
                        <td style={tableCellStyle}>${opt.bid || 0}</td>
                        <td style={tableCellStyle}>${opt.ask || 0}</td>
                        <td style={tableCellStyle}>{((opt.impliedVolatility || 0) * 100).toFixed(2)}%</td>
                        <td style={tableCellStyle}>{(opt.openInterest || 0).toLocaleString()}</td>
                        <td style={tableCellStyle}>{(opt.volume || 0).toLocaleString()}</td>
                        <td style={tableCellStyle}>{opt.inTheMoney ? '✅' : ''}</td>
                        <td style={tableCellStyle}>
                          {isOptionInWatchlist(opt, optionType) ? (
                            <button 
                              onClick={() => handleRemoveFromWatchlist(opt, optionType)}
                              style={removeButtonStyle}
                            >
                              ❌ Remove
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleAddToWatchlist(opt, optionType)}
                              style={addButtonStyle}
                            >
                              ⭐ Add
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>No options data available</div>
          )}
        </div>
      )}
    </div>
  );
}

// Add these style objects at the end of the file
const tableHeaderStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: '500',
  color: '#666',
  borderBottom: '1px solid #ddd'
};

const tableCellStyle = {
  padding: '12px 16px',
  borderBottom: '1px solid #eee'
};

const addButtonStyle = {
  padding: '6px 12px',
  backgroundColor: '#34C759',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px'
};

const removeButtonStyle = {
  padding: '6px 12px',
  backgroundColor: '#FF3B30',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px'
};
