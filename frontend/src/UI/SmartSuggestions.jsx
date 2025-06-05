import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SmartSuggestions = ({ user }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [watchlistItems, setWatchlistItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch suggestions
        const suggestionsResponse = await fetch('http://127.0.0.1:8000/smart_suggestions');
        if (!suggestionsResponse.ok) throw new Error('Failed to fetch suggestions');
        const suggestionsData = await suggestionsResponse.json();
        setSuggestions(suggestionsData);

        // Fetch watchlist items if user is logged in
        if (user?.uid) {
          const watchlistResponse = await fetch(`http://127.0.0.1:8000/get_watchlist/${user.uid}?type=options`);
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
      alert('Please login first');
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
        const response = await fetch('http://127.0.0.1:8000/remove_from_watchlist/', {
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
        const response = await fetch('http://127.0.0.1:8000/add_to_watchlist/', {
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

  if (loading) return <div style={styles.loading}>Loading suggestions...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔥 Top-Rated Options Plays This Week</h2>
      <div style={styles.grid}>
        {suggestions.map((suggestion, index) => (
          <div key={`${suggestion.symbol}-${suggestion.strike}-${suggestion.expiration}`} 
               style={styles.card}
               onClick={() => handleCardClick(suggestion)}>
            <div style={styles.cardHeader}>
              <span style={styles.symbol}>{suggestion.symbol}</span>
              <span style={styles.type}>
                ${suggestion.strike} {suggestion.option_type.toUpperCase()}
              </span>
            </div>
            <div style={styles.expiration}>
              Expires: {new Date(suggestion.expiration).toLocaleDateString()}
            </div>
            <div style={styles.metrics}>
              <div>EV: ${suggestion.ev.toFixed(2)}</div>
              <div>Prob: {(suggestion.probability * 100).toFixed(1)}%</div>
              <div>Δ: {suggestion.delta.toFixed(2)}</div>
            </div>
            <div style={styles.analysisContainer}>
              <p style={styles.analysis}>
                {expandedAnalysis[index] 
                  ? suggestion.gpt_analysis 
                  : getShortAnalysis(suggestion.gpt_analysis)}
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAnalysis(index);
                }}
                style={styles.expandButton}
              >
                {expandedAnalysis[index] ? 'Show Less' : 'Read Full GPT Analysis'}
              </button>
            </div>
            <button 
              onClick={(e) => handleWatchlistToggle(suggestion, e)}
              style={{
                ...styles.addButton,
                backgroundColor: isInWatchlist(suggestion) ? '#dc2626' : '#2563eb',
                '&:hover': {
                  backgroundColor: isInWatchlist(suggestion) ? '#b91c1c' : '#1d4ed8',
                }
              }}
            >
              {isInWatchlist(suggestion) ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#1a1a1a',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
    },
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  symbol: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#2563eb',
  },
  type: {
    fontSize: '1rem',
    color: '#4b5563',
  },
  expiration: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '1rem',
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    color: '#374151',
  },
  analysisContainer: {
    marginTop: '1rem',
    marginBottom: '1rem',
  },
  analysis: {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: '1.4',
    marginBottom: '0.5rem',
  },
  expandButton: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: '0',
    textDecoration: 'underline',
  },
  addButton: {
    width: '100%',
    padding: '0.75rem',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6b7280',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    color: '#dc2626',
  },
};

export default SmartSuggestions;