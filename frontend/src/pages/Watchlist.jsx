import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Watchlist() {
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [view, setView] = useState("stocks");

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

  const handleRemove = (item) => {
    fetch("http://127.0.0.1:8000/remove_from_watchlist/", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: firebaseUid,
        symbol: item.symbol,
        option_type: item.option_type,
        strike: item.strike,
        expiration: item.expiration,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to remove");
        
        setWatchlist((prev) =>
          prev.filter(
            (w) =>
              !(
                w.symbol === item.symbol &&
                w.option_type === item.option_type &&
                w.strike === item.strike &&
                w.expiration === item.expiration
              )
          )
        );
      })
      .catch(console.error);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>⭐ My Watchlist</h2>
      <label>
        <input
          type="radio"
          checked={view === "stocks"}
          onChange={() => setView("stocks")}
        />
        Stocks
      </label>
      <label style={{ marginLeft: "15px" }}>
        <input
          type="radio"
          checked={view === "options"}
          onChange={() => setView("options")}
        />
        Options
      </label>

      <table style={{ marginTop: "20px", width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Ticker</th>
            {view === "options" && <th>Strike</th>}
            {view === "options" && <th>Expiration</th>}
            {view === "options" && <th>Type</th>}
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {watchlist.map((item, idx) => (
            <tr key={idx}>
              <td>{item.symbol}</td>
              {view === "options" && (
                <>
                  <td>{item.strike}</td>
                  <td>{item.expiration}</td>
                  <td>{item.option_type}</td>
                </>
              )}
              <td>
                <button onClick={() => handleRemove(item)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}