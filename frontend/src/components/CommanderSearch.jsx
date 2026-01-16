import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CommanderSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUserStats, setSelectedUserStats] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // executes the actual API call to find users matching the specific pattern
  const performSearch = async (searchQuery) => {
    // pattern must be at least 2 characters to trigger backend query
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // call the REST endpoint using a query parameter for pattern matching
      const response = await fetch(`http://localhost:5000/api/users/search?query=${searchQuery}`, {
        credentials: 'include' // ensures Http-Only JWT cookie is sent for authentication
      });
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // effect handles "live search" by monitoring query changes with debouncing logic
  useEffect(() => {
    // wait for user to stop typing before triggering the API request
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    // cleanup function clears the timeout if user continues typing
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleManualSearch = () => {
    if (query.trim().length < 2) {
      toast.error("Enter at least 2 characters");
      return;
    }
    performSearch(query);
  };

  // fetches battle history for a selected commander from the search results
  const fetchUserStats = async (username) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/stats/${username}`, {
        credentials: 'include'
      });
      const data = await response.json();
      // stores retrieved data to be displayed in the modal
      setSelectedUserStats({ username, ...data });
    } catch (err) {
      toast.error("Could not load stats");
    }
  };

  return (
    <div className="lobby-wrapper">
      <div className="auth-container search-container">
        <button className="close-modal back-button" onClick={() => navigate('/lobby')}>
          ← Back to Lobby
        </button>
        
        <h2>Find Commanders ⚓</h2>
        
        <div className='search-input-group'>
          <input 
            type="text" 
            placeholder="Type username..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
          />
          <button 
            onClick={handleManualSearch} 
            className="search-button"
            disabled={isSearching}
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>

        <div className="search-results-container">
          {results.length > 0 ? (
            results.map(user => (
              <div 
                key={user.id} 
                className="search-item" 
                onClick={() => fetchUserStats(user.username)}
              >
                <div className="user-info">
                  🚢 <strong>{user.username}</strong>
                </div>
                <span className="view-stats-label">View Intel</span>
              </div>
            ))
          ) : (
            query.length >= 2 && !isSearching && (
              <p className="no-results">No commanders found for "{query}"</p>
            )
          )}
        </div>
      </div>

      {selectedUserStats && (
        <div className="stats-modal-overlay" onClick={() => setSelectedUserStats(null)}>
          <div className="stats-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedUserStats(null)}>✖</button>
            <h3>Commander Intel: {selectedUserStats.username}</h3>
            <div className="stats-grid">
              <div className="stat-card win">
                <span className="val">{selectedUserStats.wins}</span>
                <span className="lbl">Victories</span>
              </div>
              <div className="stat-card loss">
                <span className="val">{selectedUserStats.losses}</span>
                <span className="lbl">Defeats</span>
              </div>
              <div className="stat-card total">
                <span className="val">{selectedUserStats.total_games}</span>
                <span className="lbl">Total Battles</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommanderSearch;