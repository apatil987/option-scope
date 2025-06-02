import React, { useState, useEffect } from "react";
import { auth } from '../firebase';
import ExpectedValueUI from '../UI/ExpectedValueUI';

const ExpectedValue = () => {
  const [user, setUser] = useState(null);
  const [watchlistOptions, setWatchlistOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [symbol, setSymbol] = useState("");
  const [strike, setStrike] = useState("");
  const [expiration, setExpiration] = useState("");
  const [optionType, setOptionType] = useState("");
  const [premium, setPremium] = useState("");
  const [stockPrice, setStockPrice] = useState("");
  const [iv, setIV] = useState("");
  const [riskFreeRate, setRiskFreeRate] = useState(0.05);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetch(`http://127.0.0.1:8000/get_watchlist/${user.uid}?type=options`)
        .then((res) => res.json())
        .then(setWatchlistOptions)
        .catch((err) => console.error("Error fetching watchlist:", err));
    }
  }, [user]);

  const handleOptionSelect = async (option) => {
    if (!option) return;

    setSelectedOption(option);
    setSymbol(option.symbol);
    setStrike(option.strike);
    setExpiration(option.expiration);
    setOptionType(option.option_type);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/option_details/${option.symbol}/${option.expiration}/${option.strike}/${option.option_type}`
      );
      const data = await response.json();
      setPremium(data.premium);
      setStockPrice(data.stock_price);
      setIV(data.iv);
    } catch (err) {
      console.error("Error fetching option details:", err);
    }
  };

  const calculateEV = async () => {
    try {
      const expirationDate = new Date(expiration);
      const currentDate = new Date();
      const timeToExpiration =
        (expirationDate - currentDate) / (365 * 24 * 60 * 60 * 1000);

      const response = await fetch("http://127.0.0.1:8000/calculate_ev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          S: parseFloat(stockPrice),
          K: parseFloat(strike),
          T: timeToExpiration,
          r: parseFloat(riskFreeRate) / 100,
          sigma: parseFloat(iv) / 100,
          option_type: optionType.toLowerCase(),
          premium: parseFloat(premium),
        }),
      });

      if (!response.ok) throw new Error("Failed to calculate EV");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error calculating EV:", error);
      alert("Failed to calculate EV. Please check your inputs.");
    }
  };

  return (
    <ExpectedValueUI
      watchlistOptions={watchlistOptions}
      selectedOption={selectedOption}
      handleOptionSelect={handleOptionSelect}
      symbol={symbol}
      stockPrice={stockPrice}
      setStockPrice={setStockPrice}
      strike={strike}
      expiration={expiration}
      optionType={optionType}
      premium={premium}
      setPremium={setPremium}
      iv={iv}
      setIV={setIV}
      riskFreeRate={riskFreeRate}
      setRiskFreeRate={setRiskFreeRate}
      calculateEV={calculateEV}
      result={result}
    />
  );
};

export default ExpectedValue;