import { useState } from 'react';
import { auth } from '../firebase';

export const useOptions = () => {
    const [optionData, setOptionData] = useState(null);
  const [selectedExpiration, setSelectedExpiration] = useState('');
  const [optionType, setOptionType] = useState('calls');
  const [showOptions, setShowOptions] = useState(false);
  const [optionWatchlist, setOptionWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    minStrike: '',
    maxStrike: '',
    minVolume: '',
    maxIV: '',
    itmOnly: false
  });

  const fetchOptionData = async (symbolToUse, expirationToUse = selectedExpiration) => {
    if (!symbolToUse) {
      console.error('No symbol provided for options fetch');
      return;
    }

    setIsLoading(true);
    try {
      const url = `http://127.0.0.1:8000/options/${symbolToUse.toUpperCase()}?expiration=${expirationToUse || ''}`;
      console.log('Fetching options from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Received options data:', data); 
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch options data');
      }

      setOptionData(data);
      console.log('Set option data:', data);       
      if (!selectedExpiration && data.expirations && data.expirations.length > 0) {
        console.log('Setting initial expiration:', data.expirations[0]);         
        setSelectedExpiration(data.expirations[0]);
      }

      return data;
    } catch (error) {
      console.error('Error fetching options:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOptionWatchlist = async (uid) => {
    const response = await fetch(`http://127.0.0.1:8000/get_watchlist/${uid}?type=options`);
    const data = await response.json();
    setOptionWatchlist(data);
  };

  const handleAddToWatchlist = async (opt, type, symbol) => {
    const user = auth.currentUser;
    if (!user) return alert("Login first");
    if (!symbol) return alert("No symbol provided");

    const payload = {
      firebase_uid: user.uid,
      symbol: symbol.toUpperCase(),
      strike: opt.strike,
      expiration: selectedExpiration,
      option_type: type,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/add_to_watchlist/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Added ✅");
        await refreshOptionWatchlist(user.uid);
      } else if (res.status === 409) {
        alert("Already in watchlist ❌");
      } else {
        alert("Failed to add ❌");
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      alert("Failed to add ❌");
    }
  };

  const handleRemoveFromWatchlist = async (opt, type, symbol) => {
    const user = auth.currentUser;
    if (!user || !symbol) return;

    const payload = {
      firebase_uid: user.uid,
      symbol: symbol.toUpperCase(),
      strike: opt.strike,
      expiration: selectedExpiration,
      option_type: type,
    };

    try {
      await fetch("http://127.0.0.1:8000/remove_from_watchlist/", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await refreshOptionWatchlist(user.uid);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const isOptionInWatchlist = (opt, type, symbol) => {
    return optionWatchlist.some(
      item =>
        item.symbol === symbol?.toUpperCase() &&
        item.strike === opt.strike &&
        item.expiration === selectedExpiration &&
        item.option_type === type
    );
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

    return {
    optionData,
    setOptionData,                   
    selectedExpiration,
    optionType,
    showOptions,
    filters,
    isLoading,
    optionWatchlist,
    setOptionWatchlist,             
    setSelectedExpiration,
    setOptionType,
    setShowOptions,
    setFilters,
    fetchOptionData,
    isOptionInWatchlist,
    handleAddToWatchlist,
    handleRemoveFromWatchlist,
    refreshOptionWatchlist,
    applyFilters
  };
};