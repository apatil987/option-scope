import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

const Sidebar = forwardRef((props, ref) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  
  useImperativeHandle(ref, () => ({
    fetchProfile: (uid) => {
      const fetchUid = uid || user?.uid;
      if (fetchUid) {
        fetch(`http://127.0.0.1:8000/user_profile/${fetchUid}`)
          .then((res) => res.json())
          .then(setProfile)
          .catch(console.error);
      }
    }
  }));

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
      const result = await signInWithPopup(auth, provider);
      // Update last_login in backend
      await fetch("http://127.0.0.1:8000/update_last_login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebase_uid: result.user.uid }),
      });
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/");
    });
  };

  return (
    <div style={{ width: '220px', background: '#0b2c48', height: '100vh', padding: '20px', color: 'white' }}>
      <h2 style={{ color: 'white', marginBottom: '20px' }}>OptiVue</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li><Link to="/" style={{ color: 'white' }}>🏠 Home</Link></li>
        <li><Link to="/search" style={{ color: 'white' }}>📊 Search Stocks</Link></li>
        <li><Link to="/big-movers" style={{ color: 'white' }}>📈 Big Movers</Link></li>
        <li><Link to="/expected-value" style={{ color: 'white' }}>∑ Expected Value</Link></li>
        {user && (
          <>
            <li><Link to="/watchlist" style={{ color: 'white' }}>⭐ My Watchlist</Link></li>
            <li><Link to="/gpt" style={{ color: 'white' }}>🧠 GPT Forecasts</Link></li>
            <li><Link to="/settings" style={{ color: 'white' }}>⚙️ Settings</Link></li>
          </>
        )}
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
                <p style={{ color: '#c3d4e9' }}>
                  Registered:<br />
                  {profile.registered_at
                    ? (() => {
                        const d = new Date(profile.registered_at);
                        return isNaN(d) ? "N/A" : d.toLocaleString();
                      })()
                    : "N/A"}
                </p>
                <p style={{ color: '#c3d4e9' }}>
                  Last Login:<br />
                  {profile.last_login
                    ? (() => {
                        const d = new Date(profile.last_login);
                        return isNaN(d) ? "N/A" : d.toLocaleString();
                      })()
                    : "N/A"}
                </p>
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
});

export default Sidebar;
