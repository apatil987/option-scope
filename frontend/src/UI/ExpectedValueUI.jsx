import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { styles } from './ExpectedValueUI.styles';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EVHistoryChart = ({ watchlistId }) => {
  const [history, setHistory] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    // Cleanup previous chart instance
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const fetchEVHistory = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/option_ev_history/${watchlistId}`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (err) {
        console.error("Error fetching EV history:", err);
      }
    };

    if (watchlistId) {
      fetchEVHistory();
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [watchlistId]);

  if (history.length === 0) return null;

  const chartData = {
    labels: history.map(h => new Date(h.recorded_at).toLocaleString()),
    datasets: [
      {
        label: 'Expected Value',
        data: history.map(h => h.ev),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Probability ITM (%)',
        data: history.map(h => h.probability * 100),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        yAxisID: 'probability'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Expected Value History'
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Expected Value ($)'
        }
      },
      probability: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Probability ITM (%)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Line ref={chartRef} data={chartData} options={chartOptions} />
    </div>
  );
};

const ExpectedValueUI = ({
  watchlistOptions,
  selectedOption,
  handleOptionSelect,
  symbol,
  stockPrice,
  setStockPrice,
  strike,
  expiration,
  optionType,
  premium,
  setPremium,
  iv,
  setIV,
  riskFreeRate,
  setRiskFreeRate,
  calculateEV,
  result
}) => {
  const [showHistory, setShowHistory] = useState(false);

  // Reset chart visibility when option changes
  useEffect(() => {
    setShowHistory(false);
  }, [selectedOption]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Expected Value Calculator</h1>

      {/* Dropdown for Watchlist Options */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🔍 Select Option from Watchlist</h2>
        <div style={styles.dropdownContainer}>
          {watchlistOptions.length === 0 ? (
            <p style={styles.noData}>No options found in your watchlist.</p>
          ) : (
            <div style={styles.customSelect}>
              <select
                onChange={(e) =>
                  handleOptionSelect(
                    watchlistOptions.find((opt) => opt.id === parseInt(e.target.value))
                  )
                }
                style={styles.select}
              >
                <option value="">Select an option</option>
                {watchlistOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {`${option.symbol} ${option.expiration} $${option.strike} ${option.option_type}`}
                  </option>
                ))}
              </select>
              <div style={styles.selectArrow}></div>
            </div>
          )}
        </div>
      </section>

      {/* Option Details Form */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🔍 Option Details</h2>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Symbol:</label>
            <input
              type="text"
              value={symbol}
              readOnly
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Stock Price:</label>
            <input
              type="number"
              value={stockPrice}
              onChange={(e) => setStockPrice(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Strike Price:</label>
            <input
              type="number"
              value={strike}
              readOnly
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Expiration Date:</label>
            <input
              type="date"
              value={expiration}
              readOnly
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Option Type:</label>
            <input
              type="text"
              value={optionType}
              readOnly
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Premium:</label>
            <input
              type="number"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Implied Volatility (%):</label>
            <input
              type="number"
              value={iv}
              onChange={(e) => setIV(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Risk-Free Rate (%):</label>
            <input
              type="number"
              value={riskFreeRate}
              onChange={(e) => setRiskFreeRate(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>
      </section>

      <button onClick={calculateEV} style={styles.calculateButton}>
        Calculate Expected Value
      </button>

      {/* Results Section */}
      {result && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🧠 EV Result</h2>
          <div style={styles.resultsGrid}>
            <div style={styles.resultCard}>
              <p style={styles.evValue(result.ev >= 0)}>
                ✅ Expected Value
                <span>${result.ev.toFixed(2)}</span>
              </p>
              <p style={styles.metric}>
                📊 Probability ITM
                <span>{(result.probability * 100).toFixed(2)}%</span>
              </p>
              <p style={styles.metric}>
                📈 Delta
                <span>{(result.delta * 100).toFixed(2)}%</span>
              </p>
            </div>
            <div style={styles.resultCard}>
              <p style={styles.lossValue}>
                📉 Max Loss
                <span>${result.max_loss.toFixed(2)}</span>
              </p>
              <p style={styles.gainValue}>
                🟢 Max Gain
                <span>${result.max_gain.toFixed(2)}</span>
              </p>
              <p style={styles.metric}>
                💡 Breakeven
                <span>${result.breakeven.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* History Button */}
      {result && selectedOption && (
        <button 
          onClick={() => setShowHistory(!showHistory)} 
          style={styles.historyButton}
        >
          {showHistory ? 'Hide History' : 'View EV History'}
        </button>
      )}

      {/* EV History Chart */}
      {showHistory && selectedOption && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>📈 EV History</h2>
          <EVHistoryChart key={selectedOption.id} watchlistId={selectedOption.id} />
        </section>
      )}
    </div>
  );
};

export default ExpectedValueUI;