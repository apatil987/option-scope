import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Search from './pages/Search';
import Login from './components/Login';
import Settings from './pages/Settings';
import Watchlist from './pages/Watchlist';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1, padding: '20px' }}>
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/watchlist" element={<Watchlist />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

