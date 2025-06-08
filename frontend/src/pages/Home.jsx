import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaCalculator, FaChartLine, FaLock } from 'react-icons/fa';
import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import logo from '../assets/logo.png';
import styles from './Home.module.css'; // Import the CSS module

export default function Home() {
  const [topPicks, setTopPicks] = useState([]);
  const [watchlistStocks, setWatchlistStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      await fetch("${process.env.REACT_APP_API_URL}/update_last_login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebase_uid: result.user.uid }),
      });
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleQuickAction = (path) => {
    navigate(path);
  };

  const fetchWatchlist = async (uid) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/get_watchlist/${uid}?type=stocks`);
      if (!response.ok) throw new Error('Failed to fetch watchlist');
      const data = await response.json();

      const stockDetailsPromises = data.slice(0, 3).map(async (item) => {
        try {
          const priceResponse = await fetch(`${process.env.REACT_APP_API_URL}/stocks/${item.symbol}`);
          if (!priceResponse.ok) throw new Error(`Failed to fetch stock data for ${item.symbol}`);
          const priceData = await priceResponse.json();

          return {
            ...item,
            currentPrice: priceData.current_price || null,
            dayChange: priceData.price_change || null,
            dayChangePercent: priceData.percent_change || null,
          };
        } catch (err) {
          console.error(`Error fetching stock data for ${item.symbol}:`, err);
          return {
            ...item,
            currentPrice: null,
            dayChange: null,
            dayChangePercent: null,
          };
        }
      });

      const stocksWithDetails = await Promise.all(stockDetailsPromises);
      setWatchlistStocks(stocksWithDetails);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setWatchlistStocks([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const suggestionsResponse = await fetch('${process.env.REACT_APP_API_URL}/smart_suggestions');
        if (!suggestionsResponse.ok) throw new Error('Failed to fetch suggestions');
        const suggestionsData = await suggestionsResponse.json();
        setTopPicks(suggestionsData.slice(0, 3));

        if (user?.uid) {
          await fetchWatchlist(user.uid);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const renderWatchlistSection = () => {
    if (!user) {
      return (
        <section className={styles.loginPrompt}>
          <FaLock className={styles.lockIcon} />
          <h2 className={styles.loginTitle}>Track Your Investments</h2>
          <p className={styles.loginText}>
            Login to create and manage your watchlist
          </p>
          <button 
            className={styles.loginButton}
            onClick={handleLogin}
          >
            Login / Sign Up
          </button>
        </section>
      );
    }

    if (watchlistStocks.length === 0) {
      return null;
    }

    return (
      <section className={styles.watchlist}>
        <div className={styles.watchlistHeader}>
          <h2 className={styles.sectionTitle}>Watchlist</h2>
          <button 
            className={styles.viewAllButton}
            onClick={() => handleQuickAction('/watchlist')}
          >
            View all
          </button>
        </div>
        <div className={styles.watchlistGrid}>
          {watchlistStocks.map((stock) => (
            <div 
              key={stock.symbol} 
              className={styles.watchlistItem}
              onClick={() => navigate(`/search?symbol=${stock.symbol}`)}
            >
              <div className={styles.watchlistItemHeader}>
                <span className={styles.symbolText}>{stock.symbol}</span>
                <span className={styles.priceText} style={{ color: stock.dayChange >= 0 ? '#22c55e' : '#ef4444' }}>
                  ${stock.currentPrice}
                </span>
              </div>
              <div className={styles.changeContainer}>
                <span className={styles.changeText} style={{ color: stock.dayChange >= 0 ? '#22c55e' : '#ef4444' }}>
                  {stock.dayChangePercent !== null 
                    ? `${stock.dayChange >= 0 ? '+' : ''}${stock.dayChangePercent.toFixed(2)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className={styles.fullPageBackground}>
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <img src={logo} alt="OptiVue" className={styles.logo} />
        <div className={styles.headerText}>
          <h1 className={styles.title}>OptiVue</h1>
          <p className={styles.subtitle}>Smarter insights for options traders</p>
        </div>
      </div>

      {/* Top Picks Section */}
      <section className={styles.topPicks}>
        <h2 className={styles.sectionTitle}>Top Picks of the Week</h2>
        <div className={styles.picksGrid}>
          {topPicks.map((pick) => (
            <div 
              key={`${pick.symbol}-${pick.strike}-${pick.expiration}`} 
              className={styles.pickCard}
              onClick={() => navigate(`/search?symbol=${pick.symbol}&showOptions=true&strike=${pick.strike}&type=${pick.option_type}s&expiration=${pick.expiration}`)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.symbolText}>{pick.symbol}</span>
                <span className={styles.evText}>EV: ${pick.ev.toFixed(2)}</span>
              </div>
              <p className={styles.expiryText}>Expires: {pick.expiration}</p>
              <p className={styles.detailsText}>
                ${pick.strike} {pick.option_type.toUpperCase()} 
                <br />
                Probability: {(pick.probability * 100).toFixed(1)}%
              </p>
              <button 
                className={styles.showMoreButton}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/gpt');
                }}
              >
                Show more
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <button 
            className={styles.actionButton}
            onClick={() => handleQuickAction('/search')}
          >
            <FaSearch className={styles.actionIcon} />
            <span>Search Stocks</span>
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => handleQuickAction('/expected-value')}
          >
            <FaCalculator className={styles.actionIcon} />
            <span>Run EV Calculator</span>
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => handleQuickAction('/gpt')}
          >
            <FaChartLine className={styles.actionIcon} />
            <span>Forecasts</span>
          </button>
        </div>
      </section>

      {/* Conditional Watchlist Section */}
      {renderWatchlistSection()}
    </div>
    </div>
  );
}
