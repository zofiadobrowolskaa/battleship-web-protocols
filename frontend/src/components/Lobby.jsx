import { useState, useEffect } from 'react';
import socket from '../sockets/socket';
import toast from 'react-hot-toast';

const Lobby = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('Player');
  
  // join selected game room
  const joinRoom = () => {
    if (roomId !== "") {

      // connect to WebSocket only when joining a room
      socket.connect();
      
      // notify server that user wants to join a room
      socket.emit("join_room", { roomId, username });
      toast.success(`Joined room: ${roomId}`);
    }
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
    <div className="auth-container">
      <h2>Game Lobby</h2>
      <input 
        type="text" 
        placeholder="Room ID (e.g. 123)" 
        onChange={(e) => setRoomId(e.target.value)} 
      />
      <button onClick={joinRoom}>Join Match</button>
    </div>
  );
};

export default Lobby;