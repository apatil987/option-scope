import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPromptModal from '../components/LoginPromptModal';

import s from './SmartSuggestions.module.css';

const SmartSuggestions = ({ user }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [watchlistItems, setWatchlistItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch suggestions
        const suggestionsResponse = await fetch(`${import.meta.env.VITE_API_URL}/smart_suggestions`);
        if (!suggestionsResponse.ok) throw new Error('Failed to fetch suggestions');
        const suggestionsData = await suggestionsResponse.json();
        setSuggestions(suggestionsData);

        // Fetch watchlist items if user is logged in
        if (user?.uid) {
          const watchlistResponse = await fetch(`${import.meta.env.VITE_API_URL}/get_watchlist/${user.uid}?type=options`);
          if (watchlistResponse.ok) {
            const watchlistData = await watchlistResponse.json();
            // Create a map for easy lookup
            const watchlistMap = {};
            watchlistData.forEach(item => {
              // Ensure option_type ends with 's'
              const optionType = item.option_type.endsWith('s') 
                ? item.option_type 
                : item.option_type + 's';
              const key = `${item.symbol}-${item.strike}-${item.expiration}-${optionType}`;
              watchlistMap[key] = true;
            });
            setWatchlistItems(watchlistMap);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  const isInWatchlist = (suggestion) => {
    // Add 's' to option_type to match the format used elsewhere
    const optionType = suggestion.option_type.endsWith('s') 
      ? suggestion.option_type 
      : suggestion.option_type + 's';
    const key = `${suggestion.symbol}-${suggestion.strike}-${suggestion.expiration}-${optionType}`;
    return watchlistItems[key];
  };

  const handleWatchlistToggle = async (suggestion, e) => {
    e.stopPropagation();
    if (!user?.uid) {
      setShowLoginModal(true);
      return;
    }

    // Add 's' to option_type to match the format used elsewhere
    const optionType = suggestion.option_type.endsWith('s') 
      ? suggestion.option_type 
      : suggestion.option_type + 's';

    const key = `${suggestion.symbol}-${suggestion.strike}-${suggestion.expiration}-${optionType}`;

    try {
      if (isInWatchlist(suggestion)) {
        // Remove from watchlist
        const response = await fetch(`${import.meta.env.VITE_API_URL}/remove_from_watchlist/`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebase_uid: user.uid,
            symbol: suggestion.symbol,
            option_type: optionType, // Use modified option type
            strike: suggestion.strike,
            expiration: suggestion.expiration
          })
        });

        if (!response.ok) throw new Error('Failed to remove from watchlist');
        
        // Update local state
        setWatchlistItems(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      } else {
        // Add to watchlist
        const response = await fetch(`${import.meta.env.VITE_API_URL}/add_to_watchlist/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebase_uid: user.uid,
            symbol: suggestion.symbol,
            option_type: optionType, // Use modified option type
            strike: suggestion.strike,
            expiration: suggestion.expiration
          })
        });

        if (!response.ok) throw new Error('Failed to add to watchlist');
        
        // Update local state
        setWatchlistItems(prev => ({
          ...prev,
          [key]: true
        }));
      }
    } catch (err) {
      console.error('Error:', err);
      alert(isInWatchlist(suggestion) ? 'Failed to remove from watchlist' : 'Failed to add to watchlist');
    }
  };

  const handleCardClick = (suggestion) => {
    navigate(`/search?symbol=${suggestion.symbol}&showOptions=true&strike=${suggestion.strike}&type=${suggestion.option_type}s&expiration=${suggestion.expiration}`);
  };

  const toggleAnalysis = (id) => {
    setExpandedAnalysis(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getShortAnalysis = (analysis) => {
    const firstSentence = analysis.split('.')[0] + '.';
    return firstSentence.length > 100 ? firstSentence.substring(0, 100) + '...' : firstSentence;
  };

  if (loading) return <div className={s.loading}>Loading suggestions...</div>;
  if (error) return <div className={s.error}>{error}</div>;

  return (
    <>
      <div className={s.container}>
        <h2 className={s.title}>🔥 Top-Rated Options Plays This Week</h2>
        <div className={s.grid}>
          {suggestions.map((suggestion, index) => (
            <div key={`${suggestion.symbol}-${suggestion.strike}-${suggestion.expiration}`} 
                 className={s.card}
                 onClick={() => handleCardClick(suggestion)}>
              <div className={s.cardHeader}>
                <span className={s.symbol}>{suggestion.symbol}</span>
                <span className={s.type}>
                  ${suggestion.strike} {suggestion.option_type.toUpperCase()}
                </span>
              </div>
              <div className={s.expiration}>
                Expires: {new Date(suggestion.expiration).toLocaleDateString()}
              </div>
              <div className={s.metrics}>
                <div>EV: ${suggestion.ev.toFixed(2)}</div>
                <div>Prob: {(suggestion.probability * 100).toFixed(1)}%</div>
                <div>Δ: {suggestion.delta.toFixed(2)}</div>
              </div>
              <div className={s.analysisContainer}>
                <p className={s.analysis}>
                  {expandedAnalysis[index] 
                    ? suggestion.gpt_analysis 
                    : getShortAnalysis(suggestion.gpt_analysis)}
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAnalysis(index);
                  }}
                  className={s.expandButton}
                >
                  {expandedAnalysis[index] ? 'Show Less' : 'Read Full GPT Analysis'}
                </button>
              </div>
              <button 
                onClick={(e) => handleWatchlistToggle(suggestion, e)}
                className={isInWatchlist(suggestion) ? s.removeButton : s.addButton}
              >
                {isInWatchlist(suggestion) ? 'Remove from Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} className="modal" />
    </>
  );
};

export default SmartSuggestions;