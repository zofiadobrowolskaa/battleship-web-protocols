import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../sockets/socket';
import toast from 'react-hot-toast';
import Chat from './Chat';
import GameBoard from './GameBoard';
import BattleField from './BattleField';
import mqttClient from '../api/mqtt';
import GlobalChat from './GlobalChat'
import API from '../api/axios';

const Lobby = () => {
  // extract roomId from URL parameters and initialize navigation hook
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState(urlRoomId || '');
  
  // get username from sessionStorage or random
  const [username, setUsername] = useState(() => {
    return sessionStorage.getItem('username') || `Player_${Math.floor(Math.random() * 1000)}`;
  });
  
  const [isJoined, setIsJoined] = useState(!!urlRoomId);
  const [myBoard, setMyBoard] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [turn, setTurn] = useState(null);
  const [winner, setWinner] = useState(null);
  const [globalNews, setGlobalNews] = useState([]);
  const [serverStatus, setServerStatus] = useState({ onlinePlayers: 0, activeRooms: 0 });
  const [lastShot, setLastShot] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [myStats, setMyStats] = useState(null);
  const [newsList, setNewsList] = useState([]);
  const [showNewsModal, setShowNewsModal] = useState(false);

  const fetchNews = async () => {
    try {
      const response = await API.get('/news');
      setNewsList(response.data);
      setShowNewsModal(true);
    } catch (err) {
      toast.error('Could not load news');
    }
  };

  // calls backend API to get persistent game history summary
  const fetchMyStats = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/stats/${username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      const data = await response.json();
      setMyStats(data);
      setShowStats(true);
    } catch (err) {
      toast.error("Could not load statistics");
    }
  };

  // join selected game room by updating the URL path
  const joinRoom = () => {
    if (roomId.trim() !== "") {
      // connect to socket if not already connected to perform availability check
      if (!socket.connected) socket.connect();

      // check with server if room is available before navigating to prevent screen flicker
      socket.emit("check_room_availability", { roomId, username }, (response) => {
        if (response.canJoin) {
          navigate(`/game/${roomId}`);
        } else {
          toast.error(response.message);
        }
      });
    } else {
      toast.error("Enter a valid Room ID");
    }
  };

  // resets local state and disconnects socket when manually leaving the room
  const leaveRoom = () => {
    setIsJoined(false);
    setMyBoard(null);
    setGameStarted(false);
    setRoomId('');
    socket.disconnect(); 
    navigate('/lobby');
  };

  // redirects the user back to the lobby view after game completion
  const resetToLobby = () => {
    setIsJoined(false);
    setMyBoard(null);
    setGameStarted(false);
    setWinner(null);
    setTurn(null);
    setLastShot(null)
    navigate('/lobby');
  };

  // called when player finishes placing ships, sends board state to the server
  const handleBoardReady = (board) => {
    setMyBoard(board);
    // notify server that player is ready to start the game
    socket.emit("ready_to_play", { roomId: urlRoomId || roomId, board, username });
  };

  // effect handles joining the room based on URL changes
  useEffect(() => {
    if (urlRoomId) {
      // ensure the correct username is used from the current session
      const currentUsername = sessionStorage.getItem('username') || username;
      setUsername(currentUsername);

      // notify server that user wants to join a room
      socket.emit("join_room", { roomId: urlRoomId, username: currentUsername });
      
      // show chat and game UI after joining
      setIsJoined(true);
      setRoomId(urlRoomId);

      // cleanup function to disconnect socket when component unmounts or room changes
      return () => {
        socket.disconnect();
      };
    } else {
      setIsJoined(false);
    }
  }, [urlRoomId]);

  // effect: listeners for Socket.IO events
  useEffect(() => {
    // listen for notification when another player joins the room
    socket.on("player_joined", (data) => {
      toast(`${data.message} ⚓`, { icon: '🚢' });
    });

    // handle error messages from the server (e.g., room is full)
    socket.on("error_message", (data) => {
      toast.error(data.message);
      // smoothly disconnect and return to lobby if an error occurs after joining
      socket.disconnect();
      setIsJoined(false);
      navigate('/lobby', { replace: true });
    });

    // listen for game state updates and winner announcements
    socket.on("update_game", (data) => {
      const { nextTurn, gameOver } = data;
      
      // update whose turn it is
      if (nextTurn) setTurn(nextTurn);

      // sync shot data to update BattleField visual state
      setLastShot(data);

      // listen for game over event
      if (gameOver) {
        setWinner(gameOver);
        
        if (gameOver === username) {
          toast.success("VICTORY! You won the battle! 🏆", { duration: 5000 });
        } else {
          toast.error(`DEFEAT! ${gameOver} won the game. 💀`, { duration: 5000 });
        }

        // return to lobby after a short delay to let users see the final result
        setTimeout(() => {
          resetToLobby();
        }, 8000);
      }
    });

    // listen for game start event from server
    socket.on("game_start", (data) => {
      setGameStarted(true);
      setTurn(data.turn); // initialize current turn
      toast.success(`Game started! ${data.turn}'s turn`);
    });

    // cleanup listeners on component unmount
    return () => {
      socket.off("player_joined");
      socket.off("error_message");
      socket.off("update_game");
      socket.off("game_start");
    };
  }, [urlRoomId, roomId, username, navigate]);

  // reset states when navigating back to the main lobby path (/lobby)
  useEffect(() => {
    if (!urlRoomId) {
      setIsJoined(false);
      setMyBoard(null);
      setGameStarted(false);
      setWinner(null);
      setTurn(null);
      setRoomId('');
    }
  }, [urlRoomId]);

  // effect responsible for handling global MQTT feeds used in the lobby: Live Battle Feed, Live System Status
  useEffect(() => {

    // handles incoming MQTT messages and routes them by topic
    const handleMqttMessage = (topic, message) => {
      // live server telemetry (online players, active rooms, uptime)
      if (topic === 'battleship/status/dashboard') {
        try {
          const status = JSON.parse(message.toString());
          setServerStatus(status);
        } catch (e) {
          console.error("Error parsing dashboard data", e);
        }
        return;
      }

      if (topic === 'battleship/admin/alert') {
        const msgText = message.toString();
        toast.custom((t) => (
          <div className="alert-toast">
            <span className="alert-icon">🚨</span>
            <div className="alert-content">
              <h4>ALERT</h4>
              <p>{msgText}</p>
            </div>
          </div>
        ), { duration: 5000 });
        return;
      }

      // global battle notifications displayed in the lobby feed
      if (topic === 'battleship/global/news') {
        const newsText = message.toString();
        const messageId = Date.now(); // unique ID for each message

        setGlobalNews(prev => {
          // prevent duplicate identical messages from being added simultaneously
          if (prev.length > 0 && prev[0].text === newsText) return prev;
          return [{ id: messageId, text: newsText }, ...prev].slice(0, 5);
        });

        // auto-remove this specific message from the feed after 7 seconds
        setTimeout(() => {
          setGlobalNews(prev => prev.filter(msg => msg.id !== messageId));
        }, 7000);
      }
    };

    // subscribe immediately if MQTT client is already connected
    if (mqttClient.connected) {
      mqttClient.subscribe('battleship/global/news');
      mqttClient.subscribe('battleship/status/dashboard');
      mqttClient.subscribe('battleship/admin/alert');
    }

    // subscribe again on (re)connect to handle refreshes / reconnects
    const handleConnect = () => {
      mqttClient.subscribe('battleship/global/news');
      mqttClient.subscribe('battleship/status/dashboard');
      mqttClient.subscribe('battleship/admin/alert');
    };

    mqttClient.on('connect', handleConnect);
    mqttClient.on('message', handleMqttMessage);

    // cleanup MQTT subscriptions and listeners on component unmount
    return () => {
      mqttClient.unsubscribe('battleship/global/news');
      mqttClient.unsubscribe('battleship/status/dashboard');
      mqttClient.unsubscribe('battleship/admin/alert');
      mqttClient.off('connect', handleConnect);
      mqttClient.off('message', handleMqttMessage);
    };
  }, []);


  return (
    <div className="lobby-wrapper">
      {!isJoined && <GlobalChat username={username} />}

      {!isJoined && (
        <div className="floating-server-status" onClick={fetchMyStats} title="Click to view your stats">
        <div className="status-indicator">
          <span className="dot"></span>
          Battle Command Center
        </div>
        <div className="stats">
          Online Players: <strong>{serverStatus.onlinePlayers}</strong>
        </div>
        <div className="stats">
          Active Rooms: <strong>{serverStatus.activeRooms}</strong>
        </div>
      </div>
      )}

      {showStats && myStats && (
        <div className="stats-modal-overlay" onClick={() => setShowStats(false)}>
          <div className="stats-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowStats(false)}>✖</button>
            <h3>Commander Profile: {username}</h3>
            <div className="stats-grid">
              <div className="stat-card win">
                <span className="val">{myStats.wins}</span>
                <span className="lbl">Victories</span>
              </div>
              <div className="stat-card loss">
                <span className="val">{myStats.losses}</span>
                <span className="lbl">Defeats</span>
              </div>
              <div className="stat-card total">
                <span className="val">{myStats.total_games}</span>
                <span className="lbl">Total Battles</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewsModal && (
        <div className="stats-modal-overlay" onClick={() => setShowNewsModal(false)}>
          <div className="stats-modal news-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowNewsModal(false)}>✖</button>
            <h3>📢 News</h3>
            <div className="news-list-scroll">
              {newsList.length === 0 ? <p>No news yet.</p> : newsList.map(n => (
                <div key={n.id} className="lobby-news-card">
                  <h4>{n.title}</h4>
                  <small>{new Date(n.created_at).toLocaleDateString()}</small>
                  <p>{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* room join screen */}
      {!isJoined && (
        <>
          <div className="auth-container">
            <h2>Game Lobby</h2>
            <input 
              type="text" 
              placeholder="Room ID (e.g. 123)" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            />
            <button onClick={joinRoom}>Join Match</button>
          </div>

          <button className="mid-stats-button" onClick={fetchMyStats}>
            View My Stats 📊
          </button>

          <button 
            className="mid-stats-button secondary" 
            onClick={() => navigate('/search-commanders')}
          >
            Commander Search 🔍
          </button>
          <button className="floating-news-btn" onClick={fetchNews}>📰</button>

          {/* MQTT News Feed - displaying auto-dismissing news bubbles */}
          <div className="global-news-feed">
            <h4>Live Battle Feed</h4>
            {globalNews.map((news) => (
              <div key={news.id} className="news-item">
                <span className="icon">📢</span>
                <span>{news.text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ship placement phase */}
      {isJoined && !myBoard && (
        <>
          <GameBoard onBoardReady={handleBoardReady} />
        </>
      )}

      {/* waiting for opponent screen */}
      {isJoined && myBoard && !gameStarted && (
        <div className="auth-container">
          <h2>Room: {urlRoomId || roomId}</h2>
          <h4>Waiting for opponent... ⚓</h4>
        </div>
      )}

      {/* battle phase - Battlefield component handles the grid and turns */}
      {isJoined && myBoard && gameStarted && (
        <div className="setup-container battle-phase">
            <h2 className="setup-header">Battle in Room: {urlRoomId || roomId}</h2>
            <div className="battle-layout">
              <BattleField 
                  roomId={urlRoomId || roomId} 
                  username={username} 
                  myBoard={myBoard} 
                  currentTurn={turn}
                  setTurn={setTurn} 
                  winner={winner}
                  setWinner={setWinner}
                  lastShot={lastShot} 
              />
            </div>
        </div>
      )}

      {/* floating Leave Room button visible only when joined */}
      {isJoined && (
        <button className="floating-leave-btn" onClick={leaveRoom} title="Leave Room">
          Leave Room
        </button>
      )}

      {/* floating chat component */}
      {isJoined && <Chat roomId={urlRoomId || roomId} username={username} />}
    </div>
  );
};

export default Lobby;