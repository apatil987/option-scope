import React from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await fetch("http://127.0.0.1:8000/register_user/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebase_uid: user.uid,
          email: user.email,
          name: user.displayName,
        }),
      });

      setUser(user);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div style={{ width: '200px', background: '#0b2c48', height: '100vh', padding: '20px', color: 'white' }}>
      <h2 style={{ color: 'white' }}>OptiVue</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><Link to="/" style={{ color: 'white' }}>🏠 Home</Link></li>
        <li><Link to="/search" style={{ color: 'white' }}>📊 Search Stocks</Link></li>
        <li><Link to="/big-movers" style={{ color: 'white' }}>📈 Big Movers</Link></li>
        <li><Link to="/gpt" style={{ color: 'white' }}>🧠 GPT Forecasts</Link></li>
        <li><Link to="/expected-value" style={{ color: 'white' }}>∑ Expected Value</Link></li>
        <li><Link to="/watchlist" style={{ color: 'white' }}>⭐ My Watchlist</Link></li>
        <li><Link to="/settings" style={{ color: 'white' }}>⚙️ Settings</Link></li>
      </ul>

      <div style={{ marginTop: '20px' }}>
        {user ? (
          <>
            <p style={{ color: 'lightgray', fontSize: '14px' }}>Welcome, {user.displayName.split(' ')[0]}</p>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <button onClick={handleLogin}>Login With Google</button>
        )}
      </div>
    </div>
  );
}
