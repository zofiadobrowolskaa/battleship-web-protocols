// express framework to create HTTP server and routes
const express = require('express');

// middleware to allow requests from other origins (frontend)
const cors = require('cors');

// middleware that adds basic security HTTP headers
const helmet = require('helmet');

// HTTP request logger (shows requests in console)
const morgan = require('morgan');

// import the database pool to run queries with PostgreSQL
const db = require('./config/db');

// Node.js HTTP module (needed to attach Socket.IO to Express)
const http = require('http');

const { Server } = require('socket.io');

// loads environment variables from .env file into process.env
require('dotenv').config();

const initDb = require('./models/initDb');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// create HTTP server based on Express app, Socket.IO needs access to the raw HTTP server
const server = http.createServer(app);

// initialize Socket.IO server between backend and frontend
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// database initialization
initDb();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// WebSockets logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // event: join Room
  socket.on('join_room', (data) => {
    const { roomId, username } = data;
    
    // join the socket to a specific room
    socket.join(roomId);
    console.log(`User ${username} joined room: ${roomId}`);

    // notify others in the room that a new player joined
    socket.to(roomId).emit('player_joined', {
      message: `Player ${username} has joined the game!`,
      username: username
    });
  });

  // event: send Message (chat in game)
  socket.on('send_message', (data) => {
    const { roomId, username, message } = data;

    // create message object with sender and timestamp
    const messageData = {
      username,
      message,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // send to everyone in the room including the sender
    io.to(roomId).emit('receive_message', messageData);
  });

  // event when player is ready with board
  socket.on('ready_to_play', (data) => {
    const { roomId, username } = data;
    console.log(`Player ${username} is ready in room ${roomId}`);
    
    // inform the other player in the room that opponent is ready
    socket.to(roomId).emit('opponent_ready', { username });
  });
    
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
