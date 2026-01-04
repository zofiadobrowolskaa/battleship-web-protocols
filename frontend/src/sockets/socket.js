import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  autoConnect: false // prevents automatic connection when the app loads
});

export default socket;