import React from "react";
import { styles } from "./WatchlistUI.styles";
import { Sparklines, SparklinesLine } from "react-sparklines";
import OptionPriceChart from "../components/OptionPriceChart";

const WatchlistUI = ({
  watchlist,
  view,
  setView,
  sortOption,
  setSortOption,
  stockDataMap,
  timeInterval,
  setTimeInterval,
  selectedOption,
  setSelectedOption,
  handleRemove,
  navigate,
}) => {
  // Filter watchlist based on view
  const filteredWatchlist = React.useMemo(() => {
    return watchlist.filter((item) =>
      view === "stocks" ? !item.option_type : item.option_type
    );
  }, [watchlist, view]);

  return (
    <div style={styles.container}>
      <h2 style={styles.headerTitle}>
        <span style={{ marginRight: "8px" }}>⭐</span>
        My Watchlist
      </h2>

      {/* View Toggle */}
      <div style={styles.viewToggle}>
        <button
          style={{
            ...styles.toggleButton,
            backgroundColor: view === "stocks" ? "#0ea5e9" : "transparent",
            color: view === "stocks" ? "#fff" : "#64748b",
          }}
          onClick={() => setView("stocks")}
        >
          📈 Stocks
        </button>
        <button
          style={{
            ...styles.toggleButton,
            backgroundColor: view === "options" ? "#0ea5e9" : "transparent",
            color: view === "options" ? "#fff" : "#64748b",
          }}
          onClick={() => setView("options")}
        >
          🎯 Options
        </button>
      </div>

      {view === "stocks" && (
        <div style={styles.sortIntervalContainer}>
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Sort By</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={styles.select}
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="price">Price (High to Low)</option>
              <option value="gainers">Top Gainers</option>
              <option value="losers">Top Losers</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Chart Range</span>
            <select
              value={timeInterval}
              onChange={(e) => setTimeInterval(e.target.value)}
              style={styles.select}
            >
              <option value="1d">1 Day</option>
              <option value="5d">5 Days</option>
              <option value="1mo">1 Month</option>
              <option value="3mo">3 Months</option>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
            </select>
          </div>
        </div>
      )}

      {filteredWatchlist.length === 0 ? (
        <div style={styles.noData}>
          Your watchlist is empty. Add some{" "}
          {view === "stocks" ? "stocks" : "options"} to get started!
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeader}>Symbol</th>
                {view === "stocks" && (
                  <>
                    <th style={styles.tableHeader}>Chart</th>
                    <th style={styles.tableHeader}>Price</th>
                    <th style={styles.tableHeader}>Change</th>
                  </>
                )}
                {view === "options" && (
                  <>
                    <th style={styles.tableHeader}>Strike</th>
                    <th style={styles.tableHeader}>Expiration</th>
                    <th style={styles.tableHeader}>Type</th>
                    <th style={styles.tableHeader}>Chart</th>
                  </>
                )}
                <th style={styles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWatchlist.map((item, idx) => (
                <tr key={idx} style={styles.tableRow}>
                  <td
                    style={styles.linkCell}
                    onClick={() => {
                      if (view === "options") {
                        navigate(
                          `/search?symbol=${item.symbol}&showOptions=true&strike=${item.strike}&type=${item.option_type}&expiration=${item.expiration}`
                        );
                      } else {
                        navigate(`/search?symbol=${item.symbol}`);
                      }
                    }}
                  >
                    <span style={styles.symbolText}>{item.symbol}</span>
                  </td>
                  {view === "stocks" && (
                    <>
                      <td style={styles.chartCell}>
                        {stockDataMap[item.symbol]?.sparkline ? (
                          <div style={styles.sparklineContainer}>
                            <Sparklines
                              data={stockDataMap[item.symbol].sparkline}
                              width={120}
                              height={40}
                            >
                              <SparklinesLine
                                color={
                                  stockDataMap[item.symbol].change >= 0
                                    ? "#10b981"
                                    : "#ef4444"
                                }
                              />
                            </Sparklines>
                          </div>
                        ) : (
                          <div style={styles.loadingChart}>Loading...</div>
                        )}
                      </td>
                      <td style={styles.tableCell}>
                        <span style={styles.priceText}>
                          ${stockDataMap[item.symbol]?.price?.toFixed(2) || "..."}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        {stockDataMap[item.symbol]?.change && (
                          <span
                            style={
                              stockDataMap[item.symbol].change >= 0
                                ? styles.priceUp
                                : styles.priceDown
                            }
                          >
                            {stockDataMap[item.symbol].change >= 0 ? "+" : ""}
                            {stockDataMap[item.symbol].change.toFixed(2)} (
                            {stockDataMap[item.symbol].changePercent.toFixed(2)}%)
                          </span>
                        )}
                      </td>
                    </>
                  )}
                  {view === "options" && (
                    <>
                      <td style={styles.tableCell}>${item?.strike || "N/A"}</td>
                      <td style={styles.tableCell}>{item?.expiration || "N/A"}</td>
                      <td style={styles.tableCell}>
                        <span
                          style={{
                            ...styles.typeTag,
                            backgroundColor:
                              item?.option_type?.toLowerCase() === "calls"
                                ? "#dcfce7"
                                : "#fee2e2",
                            color:
                              item?.option_type?.toLowerCase() === "calls"
                                ? "#166534"
                                : "#991b1b",
                          }}
                        >
                          {item?.option_type?.toUpperCase() || "N/A"}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <button
                          style={styles.chartButton}
                          onClick={() => item && setSelectedOption(item)}
                          disabled={!item}
                        >
                          📊 View
                        </button>
                      </td>
                    </>
                  )}
                  <td style={styles.tableCell}>
                    <button
                      style={styles.removeButton}
                      onClick={() => handleRemove(item)}
                    >
                      ❌ Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "options" && selectedOption && (
        <div style={styles.optionChartContainer}>
          <div style={styles.optionChartHeader}>
            <h3 style={styles.optionChartTitle}>
              {selectedOption?.symbol || "N/A"}{" "}
              {selectedOption?.strike ? `$${selectedOption.strike}` : ""}{" "}
              {selectedOption?.option_type?.toUpperCase() || "N/A"} -{" "}
              {selectedOption?.expiration || "N/A"}
            </h3>
            <button
              style={styles.closeChartButton}
              onClick={() => setSelectedOption(null)}
            >
              ✕
            </button>
          </div>
          {selectedOption?.id ? (
            <OptionPriceChart
              watchlistId={selectedOption.id}
              ticker={selectedOption.symbol}
              strike={selectedOption.strike}
              expiration={selectedOption.expiration}
              type={selectedOption.option_type}
            />
          ) : (
            <div style={styles.errorMessage}>
              Unable to load option chart data
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WatchlistUI;