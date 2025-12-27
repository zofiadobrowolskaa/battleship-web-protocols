import { useState, useEffect } from 'react';
import socket from '../sockets/socket';
import toast from 'react-hot-toast';
import Chat from './Chat';
import GameBoard from './GameBoard';

const Lobby = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('Player');
  const [isJoined, setIsJoined] = useState(false);
  const [myBoard, setMyBoard] = useState(null);

   // join selected game room
  const joinRoom = () => {
    if (roomId !== "") {

      // connect to WebSocket only when joining a room
      socket.connect();
      
      // notify server that user wants to join a room
      socket.emit("join_room", { roomId, username });

      // show chat and game UI after joining
      setIsJoined(true);

      toast.success(`Joined room: ${roomId}`);
    }
  };

  // called when player finishes placing ships, sends board state to the server
  const handleBoardReady = (board) => {
    setMyBoard(board);
    // notify server that player is ready to start the game
    socket.emit("ready_to_play", { roomId, board, username });
  };

  useEffect(() => {

    // listen for notification when another player joins the room
    socket.on("player_joined", (data) => {
      toast(`${data.message} ⚓`, { icon: '🚢' });
    });

    // cleanup listener on component unmount
    return () => {
      socket.off("player_joined");
    };

  }, []);

  return (
    <div className="lobby-wrapper">
      
      {/* room join screen*/}
      {!isJoined && (
        <div className="auth-container">
          <h2>Game Lobby</h2>
          <input 
            type="text" 
            placeholder="Room ID (e.g. 123)" 
            onChange={(e) => setRoomId(e.target.value)} 
          />
          <button onClick={joinRoom}>Join Match</button>
        </div>
      )}

      {/* ship placement phase */}
      {isJoined && !myBoard && (
        <GameBoard onBoardReady={handleBoardReady} />
      )}

      {/* waiting for opponent + chat */}
      {isJoined && myBoard && (
        <div className="auth-container">
          <h2>Game Lobby</h2>
          <h4>Waiting for opponent... ⚓</h4>
          <Chat roomId={roomId} username={username} />
        </div>
      )}
    </div>
  );
};

export default Lobby;