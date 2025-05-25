import React from 'react';
import { styles } from './SearchUI.styles';
import TradingViewChart from '../components/TradingViewChart';

const SearchUI = ({
  symbol,
  setSymbol,
  stockData,
  error,
  showChart,
  setShowChart,
  isStockInWatchlist,
  handleRemoveStock,
  handleAddStock,
  optionsState,
  handleSearchClick,
  handleOptionChainClick
}) => {
  const {
    optionData,
    selectedExpiration,
    optionType,
    showOptions,
    filters,
    isLoading,
    setSelectedExpiration,
    setOptionType,
    setFilters,
    isOptionInWatchlist,
    handleAddToWatchlist,
    handleRemoveFromWatchlist,
    applyFilters
  } = optionsState;

  
  console.log('Options state in UI:', {
    hasData: !!optionsState.optionData,
    showOptions: optionsState.showOptions,
    expiration: optionsState.selectedExpiration,
    type: optionsState.optionType
  });

  return (
    <div style={styles.container}>
      {/* Search Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>OptiVue: Stock Lookup</h1>
        <div style={styles.searchContainer}>
          <input 
            value={symbol} 
            onChange={e => setSymbol(e.target.value)} 
            placeholder="Enter ticker symbol..." 
            style={styles.input}
          />
          <button onClick={handleSearchClick} style={styles.button}>
            Search
          </button>
          <button 
            onClick={() => setShowChart(!showChart)}
            style={{...styles.button, backgroundColor: showChart ? '#FF3B30' : '#34C759'}}
          >
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Stock Data */}
      {stockData && (
        <div style={styles.card}>
          {/* Stock Header */}
          <div style={styles.stockHeader}>
            <div>
              <h2 style={styles.stockInfo}>{stockData.symbol}</h2>
              <div style={styles.stockPrice}>
                ${stockData.current_price}
                <span style={styles.priceChange(stockData.price_change >= 0)}>
                  {stockData.price_change >= 0 ? '↑' : '↓'} ${Math.abs(stockData.price_change)} 
                  ({stockData.percent_change.toFixed(2)}%)
                </span>
              </div>
            </div>
            
            {/* Watchlist Button */}
            {isStockInWatchlist ? (
              <button onClick={handleRemoveStock} style={styles.removeButton}>
                ❌ Remove from Watchlist
              </button>
            ) : (
              <button onClick={handleAddStock} style={styles.addButton}>
                ⭐ Add to Watchlist
              </button>
            )}
          </div>

          {/* Stock Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Previous Close</div>
              <div style={styles.statValue}>${stockData.previous_close}</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statLabel}>Volume</div>
              <div style={styles.statValue}>{stockData.volume.toLocaleString()}</div>
            </div>
          </div>

          {/* Options Chain Button */}
          <button onClick={handleOptionChainClick} style={{...styles.button, width: '100%'}}>
            View Options Chain
          </button>
        </div>
      )}

      {/* Chart */}
      {showChart && symbol && (
        <div style={styles.card}>
          <TradingViewChart symbol={symbol.toUpperCase()} />
        </div>
      )}

      {/* Options Chain */}
      {optionsState.showOptions && optionData && (
        <div style={styles.card}>
          {optionsState.isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading options data...</div>
          ) : optionData && optionData[optionType] ? (
            <>
              <div style={styles.optionsContainer}>
                <select 
                  value={selectedExpiration} 
                  onChange={e => setSelectedExpiration(e.target.value)}
                  style={styles.select}
                >
                  {optionData.expirations?.map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>

                <select 
                  value={optionType} 
                  onChange={e => setOptionType(e.target.value)}
                  style={styles.select}
                >
                  <option value="calls">Calls</option>
                  <option value="puts">Puts</option>
                </select>

                <input
                  type="number"
                  placeholder="Min Strike"
                  value={filters.minStrike}
                  onChange={e => setFilters({ ...filters, minStrike: e.target.value })}
                  style={styles.filterInput}
                />
                <input
                  type="number"
                  placeholder="Max Strike"
                  value={filters.maxStrike}
                  onChange={e => setFilters({ ...filters, maxStrike: e.target.value })}
                  style={styles.filterInput}
                />
                <input
                  type="number"
                  placeholder="Min Volume"
                  value={filters.minVolume}
                  onChange={e => setFilters({ ...filters, minVolume: e.target.value })}
                  style={styles.filterInput}
                />
                <input
                  type="number"
                  placeholder="Max IV %"
                  value={filters.maxIV}
                  onChange={e => setFilters({ ...filters, maxIV: e.target.value })}
                  style={styles.filterInput}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={filters.itmOnly}
                    onChange={e => setFilters({ ...filters, itmOnly: e.target.checked })}
                  />
                  ITM Only
                </label>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f7' }}>
                      <th style={styles.tableHeader}>Strike</th>
                      <th style={styles.tableHeader}>Bid</th>
                      <th style={styles.tableHeader}>Ask</th>
                      <th style={styles.tableHeader}>IV</th>
                      <th style={styles.tableHeader}>OI</th>
                      <th style={styles.tableHeader}>Volume</th>
                      <th style={styles.tableHeader}>ITM</th>
                      <th style={styles.tableHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionData[optionType] &&
                      applyFilters(optionData[optionType]).map((opt, idx) => (
                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                          <td style={styles.tableCell}>${opt?.strike || 'N/A'}</td>
                          <td style={styles.tableCell}>${opt?.bid || 'N/A'}</td>
                          <td style={styles.tableCell}>${opt?.ask || 'N/A'}</td>
                          <td style={styles.tableCell}>
                            {opt?.impliedVolatility ? `${(opt.impliedVolatility * 100).toFixed(2)}%` : 'N/A'}
                          </td>
                          <td style={styles.tableCell}>
                            {typeof opt?.openInterest === 'number' ? opt.openInterest.toLocaleString() : 'N/A'}
                          </td>
                          <td style={styles.tableCell}>
                            {typeof opt?.volume === 'number' ? opt.volume.toLocaleString() : 'N/A'}
                          </td>
                          <td style={styles.tableCell}>{opt?.inTheMoney ? '✅' : ''}</td>
                          <td style={styles.tableCell}>
                            {isOptionInWatchlist(opt, optionType, symbol) ? (
                              <button
                                onClick={() => handleRemoveFromWatchlist(opt, optionType, symbol)}
                                style={styles.removeButton}
                              >
                                ❌ Remove
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAddToWatchlist(opt, optionType, symbol)}
                                style={styles.addButton}
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
            <div style={{ textAlign: 'center', padding: '20px' }}>
              No options data available for {symbol}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchUI;