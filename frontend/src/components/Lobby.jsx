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

 
  const [gameStarted, setGameStarted] = useState(false);
  const [turn, setTurn] = useState(null);
  const [winner, setWinner] = useState(null);

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

    // listen for a shot fired by the opponent
    socket.on("incoming_shot", (data) => {
      const { r, c, shooter } = data;

      // check locally if the shot hit any ship on my board
      // (board contains ship names or null)
      const isHit = myBoard && myBoard[r][c] !== null;
      const result = isHit ? 'hit' : 'miss';

      // send shot result back to the server
      socket.emit("shot_result", {
        roomId,
        r,
        c,
        result,
        shooter
      });

      // show feedback toast for the player
      if (isHit) {
        toast.error("We've been hit! 💥");
      } else {
        toast.success("Opponent missed! 🌊");
      }
    });

    // listen for game state updates (result of any shot)
    socket.on("update_game", (data) => {
      const { r, c, result, shooter, nextTurn } = data;

      console.log(
        `Shot by ${shooter} at [${r}, ${c}] resulted in: ${result}`
      );

      // update whose turn it is
      if (nextTurn) setTurn(nextTurn);
    });

    // listen for game start event from server
    socket.on("game_start", (data) => {
      setGameStarted(true);
      setTurn(data.turn); // initialize current turn
      toast.success(`Game started! ${data.turn}'s turn`);
    });

    // listen for game over event
    socket.on("game_over", (data) => {
      setWinner(data.winner);
      toast.success(`GAME OVER! Winner: ${data.winner}`, { duration: 6000 });
    });

    // cleanup listener on component unmount
    return () => {
      socket.off("player_joined");
      socket.off("incoming_shot");
      socket.off("update_game");
      socket.off("game_start");
      socket.off("game_over");
    };

  }, [myBoard, roomId]);

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
      {isJoined && myBoard && !gameStarted && (
        <div className="auth-container">
          <h2>Game Lobby</h2>
          <h4>Waiting for opponent... ⚓</h4>
          <Chat roomId={roomId} username={username} />
        </div>
      )}

      {/* battle phase */}
      {isJoined && myBoard && gameStarted && (
        <div className="auth-container">
          <h2>Battle Phase</h2>
          <h4>Current turn: {turn}</h4>
          {winner ? (
            <h3>Winner: {winner} 🏆</h3>
          ) : (
            <p>Prepare your moves! ⚓</p>
          )}
          <Chat roomId={roomId} username={username} />
        </div>
      )}
    </div>
  );
};

export default Lobby;
