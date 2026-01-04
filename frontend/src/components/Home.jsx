import { Link } from 'react-router-dom';

function Home({ isAuthenticated }) {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Battleship Online ⚓</h1>
          <p className="hero-subtitle">
            Sink your opponent's fleet in a classic online strategy game!
          </p>

          {!isAuthenticated ? (
            <div className="hero-actions">
              <p>
                Join thousands of players and test your tactical skills.
              </p>
              <div className="button-group">
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
                <Link to="/login" className="btn-secondary">
                  Log in
                </Link>
              </div>
            </div>
          ) : (
            <div className="hero-actions">
              <p className="welcome-back">
                Welcome aboard, Captain!
              </p>
              <Link to="/lobby" className="btn-play">
                🚢 ENTER THE LOBBY
              </Link>
            </div>
          )}
        </div>
        
        <div className="hero-stats">
          <div className="stat-card">
            <span>100+</span> Players online
          </div>
          <div className="stat-card">
            <span>1k+</span> Battles played
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;