import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../sockets/socket';
import toast from 'react-hot-toast';
import Chat from './Chat';
import GameBoard from './GameBoard';
import BattleField from './BattleField';
import mqttClient from '../api/mqtt';

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

      // connect to WebSocket only when joining a room
      socket.connect();
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

  // effect: handles global MQTT news feed with auto-dismiss functionality
  useEffect(() => {
    // defined separately to allow clean removal of the listener
    const handleMqttMessage = (topic, message) => {
      const newsText = message.toString();
      const messageId = Date.now(); // unique ID for each message

      // using functional update to maintain correct state and add unique message objects
      setGlobalNews(prev => {
        // prevent duplicate identical messages from being added simultaneously
        if (prev.length > 0 && prev[0].text === newsText) return prev;
        return [{ id: messageId, text: newsText }, ...prev].slice(0, 5);
      });

      // auto-remove this specific message from the feed after 7 seconds
      setTimeout(() => {
        setGlobalNews(prev => prev.filter(msg => msg.id !== messageId));
      }, 7000);
    };

    // subscribe to the global news topic upon connection
    mqttClient.on('connect', () => {
      mqttClient.subscribe('battleship/global/news');
    });

    // avoid duplicate listeners by removing old one before adding new one
    mqttClient.removeListener('message', handleMqttMessage);
    mqttClient.on('message', handleMqttMessage);

    // cleanup MQTT subscriptions and listeners on component unmount
    return () => {
      mqttClient.unsubscribe('battleship/global/news');
      mqttClient.removeListener('message', handleMqttMessage);
    };
  }, []);

  return (
    <div className="lobby-wrapper">
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