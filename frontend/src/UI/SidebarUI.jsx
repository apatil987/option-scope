import React from 'react';
import { Link } from 'react-router-dom';
import s from './SidebarUI.module.css';
import logo from '../assets/logo.png';

const SidebarUI = ({ user, profile, handleLogin, handleLogout, isExpanded }) => {
  return (
    <div className={`${s.sidebar} ${isExpanded ? s.expanded : s.collapsed}`}>
      <Link to="/" className={s.logoSection}>
        {isExpanded ? (
          <h2 className={s.title}>OptiVue</h2>
        ) : (
          <img src={logo} alt="OptiVue" className={s.logo} />
        )}
      </Link>
      
      <ul className={s.menuList}>
        <li>
          <Link to="/" className={`${s.menuLink} ${window.location.pathname === '/' ? s.active : ''}`}>
            <span className={s.icon}>🏠</span>
            {isExpanded && <span className={s.linkText}>Home</span>}
          </Link>
        </li>
        <li>
          <Link to="/search" className={`${s.menuLink} ${window.location.pathname === '/search' ? s.active : ''}`}>
            <span className={s.icon}>📊</span>
            {isExpanded && <span className={s.linkText}>Search Stocks</span>}
          </Link>
        </li>
        <li>
          <Link to="/gpt" className={`${s.menuLink} ${window.location.pathname === '/gpt' ? s.active : ''}`}>
            <span className={s.icon}>🧠</span>
            {isExpanded && <span className={s.linkText}>GPT Forecasts</span>}
          </Link>
        </li>
        {user && (
          <>
            <li>
              <Link to="/watchlist" className={`${s.menuLink} ${window.location.pathname === '/watchlist' ? s.active : ''}`}>
                <span className={s.icon}>⭐</span>
                {isExpanded && <span className={s.linkText}>My Watchlist</span>}
              </Link>
            </li>
            <li>
              <Link to="/expected-value" className={`${s.menuLink} ${window.location.pathname === '/expected-value' ? s.active : ''}`}>
                <span className={s.icon}>∑</span>
                {isExpanded && <span className={s.linkText}>Expected Value</span>}
              </Link>
            </li>
            <li>
              <Link to="/settings" className={`${s.menuLink} ${window.location.pathname === '/settings' ? s.active : ''}`}>
                <span className={s.icon}>⚙️</span>
                {isExpanded && <span className={s.linkText}>Settings</span>}
              </Link>
            </li>
          </>
        )}
      </ul>

      <div className={s.authSection}>
        {user ? (
          <button onClick={handleLogout} className={s.authButton}>
            <span className={s.icon}>🚪</span>
            {isExpanded && <span>Logout</span>}
          </button>
        ) : (
          <button onClick={handleLogin} className={s.authButton}>
            <GoogleIcon />
            {isExpanded && <span>Login with Google</span>}
          </button>
        )}
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 48 48"
    className={s.googleIcon}
  >
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.75 1.22 9.25 3.19l6.85-6.85C35.43 3.15 30.54 1 24 1 14.88 1 6.9 6.52 2.95 14.16l8.17 6.35C12.51 14.59 17.76 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.82 24.48c0-1.48-.13-2.9-.38-4.26H24v8.09h12.69c-.55 2.98-2.23 5.5-4.75 7.2l7.25 5.64C43.61 37.84 46.82 31.38 46.82 24.48z"/>
    <path fill="#FBBC05" d="M11.12 28.11c-.58-1.73-.91-3.57-.91-5.47s.33-3.74.91-5.47l-8.17-6.35C1.49 16.07 0 19.77 0 24c0 4.23 1.49 7.93 4.95 10.89l6.17-6.78z"/>
    <path fill="#34A853" d="M24 47c6.54 0 12.06-2.16 16.08-5.88l-7.25-5.64c-2.02 1.36-4.61 2.16-8.83 2.16-6.24 0-11.49-4.09-13.37-9.64l-6.17 6.78C6.9 41.48 14.88 47 24 47z"/>
  </svg>
);

export default SidebarUI;