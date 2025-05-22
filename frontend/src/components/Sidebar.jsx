import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div style={{
      width: '200px',
      height: '100vh',
      backgroundColor: '#0B2C48',
      padding: '20px',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <h2 style={{ color: '#fff' }}>OptiVue</h2>
      <Link to="/" style={{ color: 'white' }}>🏠 Home</Link>
      <Link to="/search" style={{ color: 'white' }}>📊 Search Stocks</Link>
      <Link to="/big-movers" style={{ color: 'white' }}>🚀 Big Movers</Link>
      <Link to="/forecasts" style={{ color: 'white' }}>🧠 GPT Forecasts</Link>
      <Link to="/expected" style={{ color: 'white' }}>∑ Expected Value</Link>
      <Link to="/watchlist" style={{ color: 'white' }}>⭐ My Watchlist</Link>
      <Link to="/settings" style={{ color: 'white' }}>⚙️ Settings</Link>

      <div style={{ marginTop: 'auto' }}>
        <button style={{
          backgroundColor: 'white',
          color: '#0B2C48',
          border: 'none',
          padding: '10px',
          cursor: 'pointer',
          borderRadius: '5px',
          width: '100%'
        }}>
          Login
        </button>
      </div>
    </div>
  );
}