import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import WatchlistUI from "../UI/WatchlistUI";
import LoginPromptModal from '../components/LoginPromptModal';
import '../components/LoginPromptModal.module.css';


export default function Watchlist() {
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [view, setView] = useState("stocks");
  const [sortOption, setSortOption] = useState("alphabetical");
  const [stockDataMap, setStockDataMap] = useState({});
  const [timeInterval, setTimeInterval] = useState("1d");
  const [selectedOption, setSelectedOption] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setFirebaseUid(user.uid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (firebaseUid) {
      fetch(`http://127.0.0.1:8000/get_watchlist/${firebaseUid}?type=${view}`)
        .then((res) => res.json())
        .then(setWatchlist)
        .catch(console.error);
    }
  }, [firebaseUid, view]);

  useEffect(() => {
    if (view === "stocks" && watchlist.length > 0) {
      const stocksOnly = watchlist.filter((item) => !item.option_type);
      const fetchStockData = async () => {
        const newStockData = {};
        for (const item of stocksOnly) {
          try {
            const res = await fetch(
              `http://127.0.0.1:8000/stock_sparkline/${item.symbol}?interval=${timeInterval}`
            );
            if (res.ok) {
              const data = await res.json();
              newStockData[item.symbol] = data;
            }
          } catch (err) {
            console.error(`Error fetching data for ${item.symbol}:`, err);
          }
        }
        
        setStockDataMap(newStockData);
      };
      fetchStockData();
    }
  }, [watchlist, view, timeInterval]);

  const handleRemove = async (item) => {
    if (!firebaseUid) {
      setShowLoginModal(true);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/remove_from_watchlist/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: firebaseUid,
          symbol: item.symbol,
          option_type: item.option_type,
          strike: item.strike,
          expiration: item.expiration,
        }),
      });

      if (!response.ok) throw new Error('Failed to remove item');
      setWatchlist((prevList) =>
        prevList.filter(
          (listItem) =>
            !(
              listItem.symbol === item.symbol &&
              listItem.option_type === item.option_type &&
              listItem.strike === item.strike &&
              listItem.expiration === item.expiration
            )
        )
      );
      setShowLoginModal(false);
    } catch (error) {
      console.error('Error removing item:', error);
      setShowLoginModal(false);
    }
  };

  const sortedWatchlist = [...watchlist].sort((a, b) => {
    if (view !== "stocks") return 0;
    const aData = stockDataMap[a.symbol] || {};
    const bData = stockDataMap[b.symbol] || {};
    switch (sortOption) {
      case "alphabetical":
        return a.symbol.localeCompare(b.symbol);
      case "price":
        return (bData.price || 0) - (aData.price || 0);
      case "gainers":
        return (bData.changePercent || 0) - (aData.changePercent || 0);
      case "losers":
        return (aData.changePercent || 0) - (bData.changePercent || 0);
      default:
        return 0;
    }
  });

  return (
    <>
      <WatchlistUI
        watchlist={sortedWatchlist}
        view={view}
        setView={setView}
        sortOption={sortOption}
        setSortOption={setSortOption}
        stockDataMap={stockDataMap}
        timeInterval={timeInterval}
        setTimeInterval={setTimeInterval}
        selectedOption={selectedOption}
        setSelectedOption={setSelectedOption}
        handleRemove={handleRemove}
        navigate={navigate}
      />
      <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}