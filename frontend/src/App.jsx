import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Watchlist from './pages/Watchlist';
import ExpectedValue from './pages/ExpectedValue';
import GPTForecasts from './pages/GPTForecasts';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar /> {/* Sidebar stays fixed on the left */}
        <main style={{ flex: 1 }}> {/* Main content dynamically fills remaining space */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/expected-value" element={<ExpectedValue />} />
            <Route path="/gpt" element={<GPTForecasts />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

