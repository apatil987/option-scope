import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { auth } from '../firebase';
import SearchUI from '../UI/SearchUI';
import { useOptions } from '../hooks/useOptions';

export default function Search() {
  const [searchParams] = useSearchParams();
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [user, setUser] = useState(null);
  const [stockWatchlist, setStockWatchlist] = useState([]);
  const [isStockInWatchlist, setIsStockInWatchlist] = useState(false);

    const optionsState = useOptions();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

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

    useEffect(() => {
    const user = auth.currentUser;
    if (user && stockData && optionsState.showOptions) {
      fetch(`http://127.0.0.1:8000/get_watchlist/${user.uid}?type=options`)
        .then(res => res.json())
        .then(data => optionsState.setOptionWatchlist(data))
        .catch(console.error);
    }
  }, [stockData, optionsState.showOptions, optionsState.selectedExpiration, optionsState.optionType]);

  useEffect(() => {
    if (optionsState.showOptions && stockData) {
      console.log('Fetching options for:', stockData.symbol);       const fetchOptions = async () => {
        try {
          await optionsState.fetchOptionData(stockData.symbol);
          console.log('Options fetched successfully');         } catch (error) {
          console.error('Error fetching options:', error);
          setError('Failed to load options data');
        }
      };
      fetchOptions();
    }
  }, [optionsState.selectedExpiration, optionsState.optionType, stockData]);

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
                        optionsState.setShowOptions(true);
            optionsState.setOptionType(typeParam === "puts" ? "puts" : "calls");
            optionsState.setSelectedExpiration(expirationParam);             optionsState.setFilters(prev => ({
              ...prev,
              minStrike: strikeParam || '',
              maxStrike: ''
            }));

            const response = await fetch(
              `http://127.0.0.1:8000/options/${symbolFromUrl.toUpperCase()}?expiration=${expirationParam || ''}`
            );
            
            if (!response.ok) {
              throw new Error('Failed to fetch options data');
            }

            const data = await response.json();
            optionsState.setOptionData(data);
          }
        } catch (error) {
          console.error("Error in loadData:", error);
          setError(error.message);
        }
      }
    };

    loadData();
  }, [searchParams]);

    const fetchStockData = async (symbolToFetch = null) => {
    try {
      const searchSymbol = symbolToFetch || symbol;      
      if (!searchSymbol) return; 
      const response = await fetch(`http://127.0.0.1:8000/stocks/${searchSymbol.toUpperCase()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Invalid ticker');
      }
      setError('');
      const data = await response.json();
      setStockData(data);
      optionsState.setOptionData(null);
      optionsState.setShowOptions(false);
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error('Error fetching stock data:', error);
    }
  };

    const handleAddStock = async () => {
    if (!user) return alert("Please login first");

    try {
      const response = await fetch("http://127.0.0.1:8000/add_to_watchlist/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: user.uid,
          symbol: stockData.symbol,
        }),
      });

      if (response.ok) {
        setStockWatchlist([...stockWatchlist, stockData]);
        setIsStockInWatchlist(true);
        alert("Added to watchlist ✅");
      } else if (response.status === 409) {
        alert("Already in watchlist ❌");
      } else {
        alert("Failed to add to watchlist ❌");
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      alert("Failed to add to watchlist ❌");
    }
  };

  const handleRemoveStock = async () => {
    if (!user) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/remove_from_watchlist/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: user.uid,
          symbol: stockData.symbol,
        }),
      });

      if (response.ok) {
        setStockWatchlist(stockWatchlist.filter(item => item.symbol !== stockData.symbol));
        setIsStockInWatchlist(false);
        alert("Removed from watchlist ✅");
      } else {
        alert("Failed to remove from watchlist ❌");
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      alert("Failed to remove from watchlist ❌");
    }
  };

  
  const handleSearchClick = () => {
    fetchStockData();
  };

  const handleOptionChainClick = async () => {
    if (symbol) {
      try {
        console.log('Clicking option chain for:', symbol);         
        optionsState.setShowOptions(true);
        await optionsState.fetchOptionData(symbol);
        console.log('Option chain loaded successfully');       
      } catch (error) {
        console.error('Error loading option chain:', error);
        setError('Failed to load options chain');
      }
    } else {
      setError('Please enter a symbol first');
    }
  };

  return (
    <SearchUI
      symbol={symbol}
      setSymbol={setSymbol}
      stockData={stockData}
      error={error}
      showChart={showChart}
      setShowChart={setShowChart}
      isStockInWatchlist={isStockInWatchlist}
      handleRemoveStock={handleRemoveStock}
      handleAddStock={handleAddStock}
      optionsState={optionsState}
      handleSearchClick={handleSearchClick}
      handleOptionChainClick={handleOptionChainClick}
    />
  );
};
