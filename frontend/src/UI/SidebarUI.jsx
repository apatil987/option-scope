import React from 'react';
import { Link } from 'react-router-dom';
import { styles } from './SidebarUI.styles.js';

const SidebarUI = ({ user, profile, handleLogin, handleLogout }) => {
  return (
    <div style={styles.sidebar}>
      <style>
        {`
          .menu-link:hover {
            background-color: rgba(255,255,255,0.15) !important;
          }
          .button:hover {
            background-color: rgba(255,255,255,0.2) !important;
          }
          .login-btn:hover {
            background-color: #3367d6 !important;
          }
        `}
      </style>
      
      <Link to="/" style={styles.titleLink}>
        <h2 style={styles.title}>OptiVue</h2>
      </Link>
      
      <ul style={styles.menuList}>
        <li><Link to="/" className="menu-link" style={styles.menuLink}>🏠 Home</Link></li>
        <li><Link to="/search" className="menu-link" style={styles.menuLink}>📊 Search Stocks</Link></li>
        <li><Link to="/gpt" className="menu-link" style={styles.menuLink}>🧠 GPT Forecasts</Link></li>
        {user && (
          <>
            <li><Link to="/watchlist" className="menu-link" style={styles.menuLink}>⭐ My Watchlist</Link></li>
            <li><Link to="/expected-value" className="menu-link" style={styles.menuLink}>∑ Expected Value</Link></li>
            <li><Link to="/settings" className="menu-link" style={styles.menuLink}>⚙️ Settings</Link></li>
          </>
        )}
      </ul>

      <div style={styles.profileSection}>
        {user ? (
          <>
            <div style={styles.userInfo}>
              <p style={styles.userName}>👤 {user.displayName?.split(' ')[0]}</p>
              <p style={styles.userEmail}>{user.email}</p>
            </div>
            {profile && (
              <div style={styles.profileDetails}>
                <p style={styles.detailText}>Account: {profile.account_type}</p>
                <p style={styles.detailText}>View: {profile.preferred_view}</p>
                <p style={styles.detailText}>
                  Registered:{' '}
                  {profile.registered_at
                    ? new Date(profile.registered_at).toLocaleString()
                    : "N/A"}
                </p>
                <p style={styles.detailText}>
                  Last Login:{' '}
                  {profile.last_login
                    ? new Date(profile.last_login).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            )}
            <button onClick={handleLogout} className="button" style={styles.logoutButton}>
              Logout
            </button>
          </>
        ) : (
          <button onClick={handleLogin} className="button login-btn" style={styles.loginButton}>
            <GoogleIcon />
            Login With Google
          </button>
        )}
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="18" 
    height="18" 
    viewBox="0 0 48 48" 
    style={{ marginRight: '8px' }}
  >
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.75 1.22 9.25 3.19l6.85-6.85C35.43 3.15 30.54 1 24 1 14.88 1 6.9 6.52 2.95 14.16l8.17 6.35C12.51 14.59 17.76 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.82 24.48c0-1.48-.13-2.9-.38-4.26H24v8.09h12.69c-.55 2.98-2.23 5.5-4.75 7.2l7.25 5.64C43.61 37.84 46.82 31.38 46.82 24.48z"/>
    <path fill="#FBBC05" d="M11.12 28.11c-.58-1.73-.91-3.57-.91-5.47s.33-3.74.91-5.47l-8.17-6.35C1.49 16.07 0 19.77 0 24c0 4.23 1.49 7.93 4.95 10.89l6.17-6.78z"/>
    <path fill="#34A853" d="M24 47c6.54 0 12.06-2.16 16.08-5.88l-7.25-5.64c-2.02 1.36-4.61 2.16-8.83 2.16-6.24 0-11.49-4.09-13.37-9.64l-6.17 6.78C6.9 41.48 14.88 47 24 47z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default SidebarUI;