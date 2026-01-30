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

// MQTT library for backend messaging
const mqtt = require('mqtt'); //

// loads environment variables from .env file into process.env
require('dotenv').config();

// middleware to parse cookies from request headers
const cookieParser = require('cookie-parser');

// Node.js built-in module for file system operations (used for logging to file)
const fs = require('fs');

// Node.js built-in module for handling and transforming file paths
const path = require('path');

const initDb = require('./models/initDb');
const GameModel = require('./models/gameModel');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { protect } = require('./middleware/authMiddleware');

const app = express();

// create HTTP server based on Express app
const server = http.createServer(app);

// create a write stream (in append mode) to a file named 'access.log' in the current directory
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// initialize Socket.IO server between backend and frontend
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// MQTT client configuration - connects backend to HiveMQ Cloud
const mqttClient = mqtt.connect(`wss://${process.env.VITE_MQTT_HOST}:8884/mqtt`, {
  username: process.env.VITE_MQTT_USER,
  password: process.env.VITE_MQTT_PASS,
  protocol: 'wss'
});

mqttClient.on('connect', () => {
  console.log('Backend connected to MQTT Broker (HiveMQ Cloud)');
});

// function periodically broadcasts live server telemetry (for lobby dashboard)
// data is consumed by MQTT clients to display real-time system status
const broadcastServerStatus = () => {
  const status = {
    // count of unique authenticated users (based on stored username in socket)
    onlinePlayers: Array.from(io.sockets.sockets.values()).filter(s => s.username).length,
    activeRooms: Object.keys(rooms).length,
    // server uptime in seconds (used for monitoring / diagnostics)
    uptime: Math.floor(process.uptime())
  };

  // publish server telemetry to MQTT for live lobby dashboard
  mqttClient.publish(
    'battleship/status/dashboard',
    JSON.stringify(status)
  );
};

// send server status update every 5 seconds
setInterval(broadcastServerStatus, 5000);

// object used to track room states: players, boards, turns, hits, and chat history
const rooms = {};

// database initialization
initDb();

// enable cors with credentials for specific frontend origin
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,  // allow browser to send and receive cookies
  methods: ["GET", "POST", "PUT", "DELETE"]
}));


app.use(helmet());
app.use(morgan('dev'));
// log all requests to 'access.log' file in professional 'combined' format
app.use(morgan('combined', { stream: accessLogStream }));
app.use(express.json());
app.use(cookieParser());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', protect, adminRoutes);

// get list of active game rooms
app.get('/api/rooms', protect, (req, res) => {
  const roomList = Object.keys(rooms).map(roomId => ({
    roomId,
    playersCount: rooms[roomId].players.length,
    isGameOver: rooms[roomId].isGameOver
  }));
  res.json(roomList);
});

// delete a specific game room by ID
app.delete('/api/rooms/:roomId', protect, (req, res) => {
  const { roomId } = req.params;
  if (rooms[roomId]) {
    io.to(roomId).emit('error_message', { message: 'Room closed by server admin.' });
    
    delete rooms[roomId];
    res.json({ message: `Room ${roomId} deleted successfully.` });
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
});

// handle a player firing a shot via HTTP
app.post('/api/game/shot', protect, (req, res) => {
  const { roomId, username, r, c } = req.body;
  const room = rooms[roomId];

  if (!room) return res.status(404).json({ message: 'Room not found' });
  if (room.isGameOver) return res.status(400).json({ message: 'Game is over' });
  if (room.turn !== username) return res.status(400).json({ message: 'Not your turn' });

  const shooter = room.players.find(p => p.username === username);
  const victim = room.players.find(p => p.username !== username);

  if (!shooter || !victim) return res.status(400).json({ message: 'Players error' });

  console.log(`HTTP Shot in Room ${roomId}: ${username} fired at [R:${r}, C:${c}]`);

  const shipName = victim.board[r][c];
  const result = shipName !== null ? 'hit' : 'miss';
  let sunkShipName = null;

  if (result === 'hit') {
    victim.hitsTaken += 1;
    victim.board[r][c] = 'HIT_SEGMENT';

    const isSunk = !victim.board.some(row => row.includes(shipName));
    if (isSunk) {
      sunkShipName = shipName;
      mqttClient.publish('battleship/global/news', `BOOM! ${shooter.username} sunk a ${sunkShipName} via HTTP!`);
    }
  }

  room.turn = victim.username;
  const isGameOver = victim.hitsTaken === 17;

  io.to(roomId).emit('update_game', {
    r, c, result,
    shooter: shooter.username,
    nextTurn: room.turn,
    sunkShip: sunkShipName,
    gameOver: isGameOver ? shooter.username : null
  });

  if (isGameOver) {
    room.isGameOver = true;
    GameModel.recordGame(shooter.username, victim.username, 'destruction');
  }

  // respond to the HTTP request with the result of the shot
  res.json({ result, sunkShip: sunkShipName, nextTurn: room.turn });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// WebSockets logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('check_room_availability', (data, callback) => {
    const { roomId, username } = data;
    const room = rooms[roomId];

    if (room) {
      const existingPlayer = room.players.find(p => p.username === username);
      // if player is not already in the room and room is full
      if (!existingPlayer && room.players.length >= 2) {
        return callback({ 
          canJoin: false, 
          message: 'Room is full! Max 2 players allowed.' 
        });
      }
    }
    // room doesn't exist yet or has space
    callback({ canJoin: true });
  });

  // player joins a game room, stores player info in the room state
  socket.on('join_room', (data) => {
    const { roomId, username } = data;
    socket.username = username; // internal reference for telemetry

    // create room if it doesn't exist, including chat history and game status
    if (!rooms[roomId]) {
      rooms[roomId] = { 
        players: [], 
        turn: null, 
        chatHistory: [], // stores previous messages for new joiners
        isGameOver: false // status flag to prevent forfeit logic after natural win
      };
    }

    const room = rooms[roomId];
    const existingPlayer = room.players.find(p => p.username === username);
    
    // player limit logic
    if (!existingPlayer && room.players.length >= 2) {
      console.log(`Room ${roomId} is full. User ${username} tried to join.`);
      socket.emit('error_message', { message: 'Room is full! Max 2 players allowed.' });
      return; 
    }

    // join Socket.IO room
    socket.join(roomId);
    // store roomId in socket object for easier access during disconnect
    socket.currentRoom = roomId;

    if (!existingPlayer) {
      // register player
      room.players.push({
        id: socket.id,
        username,
        board: null,
        hitsTaken: 0 // number of ship segments hit by the opponent
      });

      console.log(`User ${username} joined room: ${roomId}`);

      // create a system message about the join event
      const joinMessage = {
        username: 'System',
        message: `${username} entered the room.`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      };

      // save system message to history and broadcast to everyone
      room.chatHistory.push(joinMessage);

      // notify others in the room that a new player joined
      socket.to(roomId).emit('player_joined', { 
          message: `${username} entered the room!` 
        });

      io.to(roomId).emit('receive_message', joinMessage);

      // publish global notification about player joining a specific room
      mqttClient.publish('battleship/global/news', `Player ${username} entered Room ${roomId}! ⚓`);

    } else {
      // reconnect: update socket ID for existing player
      existingPlayer.id = socket.id; 
    }

    // send chat history to the joining player so they can see previous messages
    if (room.chatHistory.length > 0) {
      socket.emit('chat_history', room.chatHistory);
    }
  });

  socket.on('request_chat_history', (roomId) => {
    const room = rooms[roomId];
    if (room && room.chatHistory) {
      socket.emit('chat_history', room.chatHistory);
    }
  });

  // player finished placing ships and is ready, server stores board for validation and game logic
  socket.on('ready_to_play', (data) => {
    const { roomId, board } = data;
    const room = rooms[roomId];
    if (!room) return;

    // if a new game is starting in an existing room object, reset its over status
    if (room.isGameOver) {
        room.isGameOver = false;
        room.turn = null;
    }

    // assign board and reset hit counter for this player using socket.id
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.board = board;
      player.hitsTaken = 0;
    }

    const readyPlayers = room.players.filter(p => p.board !== null);

    if (readyPlayers.length === 2) {
      // decide who starts (first joined player)
      room.turn = room.players[0].username;
      
      // notify both players that the game has started
      io.to(roomId).emit('game_start', {
        turn: room.turn
      });

      // global broadcast that a real battle has begun
      mqttClient.publish('battleship/global/news', `BATTLE START! ${room.players[0].username} vs ${room.players[1].username} in Room ${roomId}! ⚔️`);
    } else {
      // only one player ready - notify opponent
      socket.to(roomId).emit('opponent_ready', { username: player?.username });
    }
  });

  // player fires a shot, shot is processed and result is broadcasted
  socket.on('fire', (data) => {
    const { roomId, r, c } = data;
    const room = rooms[roomId];
    if (!room || room.isGameOver) return; // Prevent fire if game is already over

    const shooter = room.players.find(p => p.id === socket.id);
    const victim = room.players.find(p => p.id !== socket.id);

    // ensure both players exist and it is the shooter's turn
    if (!shooter || !victim || room.turn !== shooter.username) return;

    console.log(`Room ${roomId}: ${shooter.username} fired at [R:${r}, C:${c}]`);

    // validate hit on server-side stored board
    const shipName = victim.board[r][c]; // Get ship name (e.g., 'Carrier') or null
    const result = shipName !== null ? 'hit' : 'miss';
    let sunkShipName = null;

    if (result === 'hit') {
      // if the shot was a hit, increase hit counter of the victim
      victim.hitsTaken += 1;

      // mark the coordinate on the victim's board as hit so it's no longer counted as a ship segment
      victim.board[r][c] = 'HIT_SEGMENT';

      // check for sinking:
      // if no cells on the victim's board contain the original ship name, it's sunk
      const isSunk = !victim.board.some(row => row.includes(shipName));
      if (isSunk) {
        sunkShipName = shipName;
        console.log(`Room ${roomId}: ${shooter.username} sunk the enemy's ${sunkShipName}!`);
        
        // notify the global lobby about the tactical achievement
        mqttClient.publish('battleship/global/news', `BOOM! ${shooter.username} sunk a ${sunkShipName} in Room ${roomId}! 💥`);
      }
    }

    // change the turn to the other player
    room.turn = victim.username;
    
    // check if all 17 ship segments are hit
    const isGameOver = victim.hitsTaken === 17;

    // broadcast the result, next turn, and sunk ship info to both players
    io.to(roomId).emit('update_game', {
      r,
      c,
      result,
      shooter: shooter.username,
      nextTurn: room.turn,
      sunkShip: sunkShipName, // sends ship name if it was just sunk, otherwise null
      gameOver: isGameOver ? shooter.username : null
    });

    if (isGameOver) {
      room.isGameOver = true; // set flag to block forfeit logic in disconnect
      console.log(`Room ${roomId}: Game Over. Winner: ${shooter.username}`);
      console.log(`Room ${roomId}: ${victim.username} lost the battle.`); // additional log for the loser

      // save game history to database (normal win)
      GameModel.recordGame(shooter.username, victim.username, 'destruction');

      // victory announcement for everyone in the global lobby
      mqttClient.publish('battleship/global/news', `VICTORY! ${shooter.username} destroyed the enemy fleet in Room ${roomId}! 🏆`);
    }
  });

  // event: send message (chat in game)
  socket.on('send_message', (data) => {
    const { roomId, username, message } = data;
    const room = rooms[roomId];
    if (!room) return;

    // create message object with sender and timestamp
    const messageData = {
      username,
      message,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    // save message to room history and send to everyone in the room
    room.chatHistory.push(messageData);
    io.to(roomId).emit('receive_message', messageData);
  });

  // remove player from the room state
  socket.on('disconnect', () => {
    const roomId = socket.currentRoom;
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const leavingPlayer = room.players[playerIndex];
        
        // ONLY execute forfeit logic if the game was actually in progress and NOT already over
        if (room.players.length === 2 && room.turn !== null && !room.isGameOver) {
          const winnerPlayer = room.players.find(p => p.id !== socket.id);
          
          if (winnerPlayer) {
            console.log(`Room ${roomId}: ${leavingPlayer.username} left during battle. Winner by forfeit: ${winnerPlayer.username}`);
            
            // save game history to database (forfeit)
            GameModel.recordGame(winnerPlayer.username, leavingPlayer.username, 'forfeit');

            // notify the remaining player about the victory due to opponent's disconnection
            io.to(roomId).emit('update_game', {
              gameOver: winnerPlayer.username,
              isForfeit: true
            });
          }
        }

        // notify others about disconnection and save it to history
        const disconnectMsg = {
          username: 'System',
          message: `${leavingPlayer.username} disconnected.`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        };
        
        room.chatHistory.push(disconnectMsg);
        io.to(roomId).emit('receive_message', disconnectMsg);

        // remove the disconnected player from the room state
        room.players.splice(playerIndex, 1);

        // delete room if empty
        if (room.players.length === 0) delete rooms[roomId];
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});