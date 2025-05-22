import React, { useState, useEffect } from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        try {
          await fetch("http://127.0.0.1:8000/register_user/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firebase_uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName,
            }),
          });
        } catch (err) {
          console.error("Registration error:", err);
        }

        try {
          const res = await fetch(`http://127.0.0.1:8000/user_profile/${currentUser.uid}`);
          const data = await res.json();
          setProfile(data);
        } catch (err) {
          console.error("Profile fetch error:", err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div style={{ width: '220px', background: '#0b2c48', height: '100vh', padding: '20px', color: 'white' }}>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>OptiVue</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><Link to="/" style={{ color: 'white' }}>🏠 Home</Link></li>
        <li><Link to="/search" style={{ color: 'white' }}>📊 Search Stocks</Link></li>
        <li><Link to="/big-movers" style={{ color: 'white' }}>📈 Big Movers</Link></li>
        <li><Link to="/gpt" style={{ color: 'white' }}>🧠 GPT Forecasts</Link></li>
        <li><Link to="/expected-value" style={{ color: 'white' }}>∑ Expected Value</Link></li>
        <li><Link to="/watchlist" style={{ color: 'white' }}>⭐ My Watchlist</Link></li>
        <li><Link to="/settings" style={{ color: 'white' }}>⚙️ Settings</Link></li>
      </ul>

      <div style={{ marginTop: '30px', fontSize: '14px' }}>
        {user ? (
          <>
            <p style={{ color: 'lightgray' }}>👤 {user.displayName?.split(' ')[0]}</p>
            <p style={{ color: 'lightgray' }}>{user.email}</p>

            {profile && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ color: '#c3d4e9' }}>Account: {profile.account_type}</p>
                <p style={{ color: '#c3d4e9' }}>View: {profile.preferred_view}</p>
                <p style={{ color: '#c3d4e9' }}>Last Login:<br />{new Date(profile.last_login).toLocaleString()}</p>
              </div>
            )}
            <button onClick={handleLogout} style={{ marginTop: '10px' }}>Logout</button>
          </>
        ) : (
          <button onClick={handleLogin}>Login With Google</button>
        )}
      </div>
    </div>
  );
}
