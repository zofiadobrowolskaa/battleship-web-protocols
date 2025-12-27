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

// create HTTP server based on Express app
const server = http.createServer(app);

// initialize Socket.IO server between backend and frontend
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// object used to track room states: players, boards, turns, hits
const rooms = {};

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

  // player joins a game room, stores player info in the room state
  socket.on('join_room', (data) => {
    const { roomId, username } = data;

    // join Socket.IO room
    socket.join(roomId);

    // create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], turn: null };
    }

    // register player
    rooms[roomId].players.push({
      id: socket.id,
      username,
      board: null,
      hitsTaken: 0 // number of ship segments hit by the opponent
    });

    console.log(`User ${username} joined room: ${roomId}`);

    // notify others in the room that a new player joined
    socket.to(roomId).emit('player_joined', {
      message: `Player ${username} has joined the game!`,
      username
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

  // player finished placing ships and is ready, server stores board for validation and game logic
  socket.on('ready_to_play', (data) => {
    const { roomId, board, username } = data;

    console.log(`Player ${username} is ready in room ${roomId}`);

    const room = rooms[roomId];
    if (!room) return;

    // assign board and reset hit counter for this player
    const player = room.players.find(p => p.username === username);
    if (player) {
      player.board = board;
      player.hitsTaken = 0;
    }

    const readyPlayers = room.players.filter(p => p.board);

    if (readyPlayers.length === 2) {
      // decide who starts (first joined player)
      room.turn = room.players[0].username;

      // notify both players that the game has started
      io.to(roomId).emit('game_start', {
        turn: room.turn
      });
    } else {
      // only one player ready - notify opponent
      socket.to(roomId).emit('opponent_ready', { username });
    }
  });

  // player fires a shot, shot is forwarded to the opponent for validation
  socket.on('fire', (data) => {
    const { roomId, shooter, r, c } = data;

    console.log(`Player ${shooter} fired at [${r}, ${c}] in room ${roomId}`);

    // forward the shot ONLY to the opponent in the room
    socket.to(roomId).emit('incoming_shot', {
      r,
      c,
      shooter
    });
  });

  // result of a shot (calculated by defending player)
  socket.on('shot_result', (data) => {
    const { roomId, r, c, result, shooter } = data;

    const room = rooms[roomId];
    if (!room) return;

    // if the shot was a miss, change the turn to the other player
    if (result === 'miss') {
      const nextPlayer = room.players.find(p => p.username !== room.turn);
      room.turn = nextPlayer.username;
    }

    // if the shot was a hit, increase hit counter of the victim
    if (result === 'hit') {
      const victim = room.players.find(p => p.username !== shooter);
      victim.hitsTaken += 1;

      // 17 is the total number of ship segments in classic Battleship
      if (victim.hitsTaken === 17) {
        io.to(roomId).emit('game_over', {
          winner: shooter
        });
        return; // stop further processing
      }
    }

    // broadcast the result and next turn to both players
    io.to(roomId).emit('update_game', {
      r,
      c,
      result,
      shooter,
      nextTurn: room.turn
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});