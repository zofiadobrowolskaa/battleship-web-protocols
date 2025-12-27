import { Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import socket from './sockets/socket';
import Login from './components/Login';
import Register from './components/Register';
import Lobby from './components/Lobby';

function App() {
  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">
          <h1>🚢 Battleship Online</h1>
        </Link>

        <div className="nav-links">
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<h2 className="page">Welcome to Battleship Online ⚓</h2>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<h2 className="page">Your profile</h2>} />
        <Route path="/lobby" element={<Lobby />} />
      </Routes>

      <Toaster position="top-right" />
    </>
  );
}

export default App;
