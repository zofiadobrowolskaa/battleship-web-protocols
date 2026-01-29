import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Lobby from './components/Lobby';
import Home from './components/Home';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './components/Profile';
import API from './api/axios';
import CommanderSearch from './components/CommanderSearch';

function App() {
  // verify authentication by checking if username exists in session storage
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('username'));
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async (e) => {
    if (e) e.preventDefault();
    
    try {
      // inform the backend to clear the Http-Only cookie
      await API.post('/auth/logout');
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      // always clear local state even if server request fails
      sessionStorage.removeItem('username'); 
      setIsAuthenticated(false);
      navigate('/', { replace: true });
    }
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
              <Link to="/profile">Profile</Link>
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
        <Route path="/lobby" 
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          } 
        />
        {/* dynamic route for specific game rooms using roomId parameter */}
        <Route path="/game/:roomId" 
          element={
            <ProtectedRoute>
              <Lobby />
            </ProtectedRoute>
          } 
        />
        <Route path="/search-commanders" element={<CommanderSearch />} />
        <Route path="/profile" 
          element={
            <ProtectedRoute>
              <Profile onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
      </Routes>

      <Toaster position="top-right" />
    </>
  );
}

export default App;