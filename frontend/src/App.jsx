import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Lobby from './components/Lobby';
import Home from './components/Home';

function App() {
  // check if token exists in session storage to initialize authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('token'));
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    // remove authentication credentials from session storage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username'); 
    
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">
          <h1>🚢 Battleship Online</h1>
        </Link>
        <div className="nav-links">
          {!isAuthenticated ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              <Link to="/lobby">Lobby</Link>
              <a href="/" onClick={handleLogout} className="logout-link">
                Logout
              </a>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home isAuthenticated={isAuthenticated} />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lobby" element={<Lobby />} />
        {/* dynamic route for specific game rooms using roomId parameter */}
        <Route path="/game/:roomId" element={<Lobby />} />
      </Routes>

      <Toaster position="top-right" />
    </>
  );
}

export default App;