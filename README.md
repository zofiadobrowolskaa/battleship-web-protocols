# Battleship: Real-Time Multiplayer Naval Combat

<div align="center">

**A sophisticated, multi-protocol battleship game showcasing modern web communication technologies**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![MQTT](https://img.shields.io/badge/MQTT-Protocol-660066)](https://mqtt.org/)

[Features](#-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [API Reference](#-api-reference)

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Communication Protocols](#-communication-protocols)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## Overview

Battleship Real-Time Multiplayer is a modern implementation of the classic naval strategy game, built as a demonstration of heterogeneous web communication protocols working in harmony. The application leverages **REST APIs** for user management, **WebSockets** for real-time gameplay, and **MQTT** for pub/sub messaging-showcasing their respective strengths in a production-grade environment.

### Key Highlights

- **Full-featured multiplayer** with real-time synchronization
- **Production-ready security** with JWT authentication and bcrypt encryption
- **Live statistics dashboard** powered by MQTT telemetry
- **Comprehensive admin panel** with full CRUD operations
- **Dual chat systems**: private in-game and global lobby chat
- **Responsive design** optimized for desktop and mobile devices
- **Robust error handling** with forfeit mechanics and reconnection support

---

## Features

### Real-Time Gameplay

#### WebSocket-Powered Game Engine
- **Instant shot synchronization** with server-side validation
- **Turn-based mechanics** with automatic turn switching
- **Ship sinking detection** with real-time notifications
- **Room management** supporting 2-player private matches
- **Reconnection handling** preserving game state
- **Forfeit system** awarding victory on opponent disconnect

#### Advanced Ship Placement
- Interactive 10×10 grid with drag-and-drop support
- **Adjacency validation**: ships cannot touch each other
- 5 naval vessels with authentic sizing:
  - Carrier (5 cells)
  - Battleship (4 cells)
  - Cruiser (3 cells)
  - Submarine (3 cells)
  - Destroyer (2 cells)

### Communication Systems

#### In-Game Private Chat
- **Real-time messaging** synchronized via WebSockets
- **Typing indicators** showing when opponent is composing
- **Persistent chat history** loaded on room join
- **System notifications** for player events (join/leave)

#### Global Lobby Chat
- **MQTT pub/sub** broadcasting to all connected players
- Accessible from lobby before entering matches
- No message persistence (live feed only)

#### Event Broadcasting
- **Global news ticker** announcing:
  - Match starts and completions
  - Ship sinking events
  - Player room entries
- **Server status telemetry** (every 5 seconds):
  - Online player count
  - Active rooms
  - Server uptime
- **Admin alerts** broadcasted as toast notifications

### Administration Dashboard

Secured admin panel (`/admin`) with authentication middleware:

- **News Management**
  - Create/edit/delete lobby announcements
  - Stored in PostgreSQL and served via REST API
  
- **Game History Viewer**
  - Complete match logs with winners, losers, finish reasons
  - Manual record deletion capability
  
- **Admin Board**
  - Internal notes and task management for administrators
  - Report creation and resolution tracking
  
- **Alert Broadcast System**
  - Send instant MQTT notifications to all active players
  - Appears as toast messages on all clients

### Player Features

- **Commander Search**: Query player statistics using PostgreSQL ILIKE pattern matching
- **Player's statistics**: View personal win/loss records and total games played
- **Statistics Dashboard**: Database-backed leaderboard accessible from lobby
- **Responsive Navigation**: Seamless routing with React Router

---

## Architecture

### System Design

```
┌─────────────────┐          ┌──────────────────┐          ┌─────────────────┐
│  React Client   │          │   Node.js API    │          │   PostgreSQL    │
│   (Frontend)    │◄────────►│   (Backend)      │◄────────►│    Database     │
│                 │   REST   │                  │   SQL    │                 │
│  - Vite Build   │          │  - Express       │          │  - Users        │
│  - Socket.io    │          │  - Socket.io     │          │  - Games        │
│  - MQTT.js      │          │  - JWT Auth      │          │  - News         │
└────────┬────────┘          └────────┬─────────┘          └─────────────────┘
         │                            │
         │        WebSocket           │
         │◄──────────────────────────►│
         │    (Game Events)           │
         │                            │
         │                            │
         └────────────┐      ┌────────┘
                      │      │
                      ▼      ▼
                ┌─────────────────┐
                │   MQTT Broker   │
                │   (HiveMQ)      │
                │                 │
                │  - News Feed    │
                │  - Telemetry    │
                │  - Global Chat  │
                │  - Admin Alerts │
                └─────────────────┘
```

### Communication Flow

| Protocol | Use Case | Direction | Persistence |
|----------|----------|-----------|-------------|
| **REST API** | User auth, CRUD operations | Client ↔ Server | Database |
| **WebSocket** | Game actions, private chat | Bidirectional | Memory + DB (history) |
| **MQTT** | Global events, telemetry | Pub/Sub | None (live only) |

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| Vite | 7.2.4 | Build tool and dev server |
| React Router | 7.11.0 | Client-side routing |
| Socket.io Client | 4.8.3 | WebSocket communication |
| MQTT.js | 5.14.1 | MQTT protocol client |
| Axios | 1.13.2 | HTTP client |
| Formik + Yup | 2.4.9 / 1.7.1 | Form validation |
| Sass | 1.97.1 | CSS preprocessing |
| React Hot Toast | 2.6.0 | Notification system |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express | 5.2.1 | Web framework |
| Socket.io | 4.8.3 | WebSocket server |
| MQTT | 5.14.1 | MQTT client |
| PostgreSQL (pg) | 8.16.3 | Database driver |
| JSON Web Token | 9.0.3 | Authentication |
| bcryptjs | 3.0.3 | Password hashing |
| Helmet | 8.1.0 | Security headers |
| Morgan | 1.10.1 | HTTP request logging |
| CORS | 2.8.5 | Cross-origin configuration |
| cookie-parser | 1.4.7 | Cookie handling |
| dotenv | 17.2.3 | Environment configuration |

### Infrastructure
- **Database**: PostgreSQL 12+
- **MQTT Broker**: HiveMQ Cloud (or compatible broker)

---

## Installation

### Prerequisites

Before starting, ensure you have:

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** v12 or higher ([Download](https://www.postgresql.org/download/))
- **MQTT Broker** access (HiveMQ Cloud recommended - [Get Free Account](https://www.hivemq.com/mqtt-cloud-broker/))
- **Git** (optional, for cloning)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd battleship-web-protocols
```

### Step 2: Database Setup

1. **Create PostgreSQL database:**

```sql
CREATE DATABASE battleship_db;
```

2. **Verify connection** (optional):

```bash
psql -U postgres -d battleship_db
```

> **Note**: The application automatically creates all required tables on first startup via `initDb.js`.

### Step 3: Environment Configuration

Create `.env` files in **both** `backend` and `frontend` directories:

#### `backend/.env`
```env
# Server Configuration
PORT=5000

# Database Configuration
DB_NAME=battleship_db
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
DB_HOST=localhost
DB_DIALECT=postgres

# Security
JWT_SECRET=your_secure_random_string_here_min_32_chars

# MQTT Configuration
VITE_MQTT_HOST=your_hivemq_cluster.hivemq.cloud
VITE_MQTT_USER=your_mqtt_username
VITE_MQTT_PASS=your_mqtt_password
```

#### `frontend/.env`
```env
# MQTT Configuration (must match backend)
VITE_MQTT_HOST=your_hivemq_cluster.hivemq.cloud
VITE_MQTT_USER=your_mqtt_username
VITE_MQTT_PASS=your_mqtt_password
```

> **Security Note**: Never commit `.env` files to version control. They're included in `.gitignore` by default.

### Step 4: Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### Step 5: Start the Application

**Terminal 1** - Start backend:
```bash
cd backend
node src/server.js
```

**Terminal 2** - Start frontend:
```bash
cd frontend
npm run dev
```

### Step 6: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend Health Check**: http://localhost:5000/health

---

## Usage

### Getting Started

1. **Register an account** at `/register`
2. **Login** at `/login` (JWT token stored in HttpOnly cookie)
3. **Navigate to Lobby** from the navbar

### Playing a Game

1. **Create or join a room** by entering a Room ID
2. **Place your ships** on the 10×10 grid:
   - Click ship buttons to select
   - Click grid cells to place horizontally
   - Ships cannot overlap or touch adjacent cells
3. **Wait for opponent** to finish setup
4. **Take turns** firing shots when it's your turn
5. **Win** by sinking all opponent ships (17 hits total)

### Admin Access

1. **Toggle Admin Mode** using the navbar button
2. **Navigate to `/admin`** (requires authentication)
3. Access features:
   - Manage news articles
   - View game history
   - Create admin reports
   - Broadcast alerts to all players

### Additional Features

- **View Statistics**: Click "Show My Stats" in lobby
- **Search Players**: Use Commander Search to find opponents
- **Global Chat**: Communicate with all lobby users via MQTT
- **News**: Click "Show News" to view server announcements

---

## Project Structure

```
battleship-web-protocols/
├── backend/
│   ├── src/
│   │   ├── server.js              # Main application entry point
│   │   ├── config/
│   │   │   └── db.js              # PostgreSQL connection pool
│   │   ├── controllers/
│   │   │   ├── adminController.js # Admin CRUD operations
│   │   │   ├── authController.js  # Login/register/logout logic
│   │   │   ├── newsController.js  # News article management
│   │   │   └── userController.js  # User stats and search
│   │   ├── middleware/
│   │   │   └── authMiddleware.js  # JWT verification middleware
│   │   ├── models/
│   │   │   ├── gameModel.js       # Game history database queries
│   │   │   └── initDb.js          # Database schema initialization
│   │   └── routes/
│   │       ├── adminRoutes.js     # Admin API endpoints
│   │       ├── authRoutes.js      # Authentication endpoints
│   │       ├── newsRoutes.js      # News API endpoints
│   │       └── userRoutes.js      # User API endpoints
│   ├── package.json
│   └── .env                       # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root component with routing
│   │   ├── main.jsx               # Application entry point
│   │   ├── gameHelpers.js         # Ship placement validation logic
│   │   ├── api/
│   │   │   ├── axios.js           # Axios instance configuration
│   │   │   └── mqtt.js            # MQTT client configuration
│   │   ├── components/
│   │   │   ├── AdminPanel.jsx     # Admin dashboard
│   │   │   ├── BattleField.jsx    # Opponent's grid (attack view)
│   │   │   ├── Chat.jsx           # In-game private chat
│   │   │   ├── CommanderSearch.jsx# Player search interface
│   │   │   ├── GameBoard.jsx      # Own grid (ship placement & defense)
│   │   │   ├── GlobalChat.jsx     # MQTT-powered lobby chat
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── Lobby.jsx          # Main game lobby
│   │   │   ├── Login.jsx          # Login form
│   │   │   ├── Profile.jsx        # User profile page
│   │   │   ├── ProtectedRoute.jsx # Auth route guard
│   │   │   └── Register.jsx       # Registration form
│   │   ├── sockets/
│   │   │   └── socket.js          # Socket.io client instance
│   │   └── styles/
│   │       ├── global.scss        # Global styles and variables
│   │       ├── components/        # Component-specific styles
│   │       └── pages/             # Page-specific styles
│   ├── public/                    # Static assets
│   ├── index.html                 # HTML entry point
│   ├── vite.config.js             # Vite configuration
│   ├── package.json
│   └── .env                       # Frontend environment variables
│
└── README.md                      # This file
```

---

## API Reference

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "commander_alex",
  "email": "alex@example.com",
  "password": "securePassword123"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "commander_alex",
    "email": "alex@example.com"
  }
}
```

---

#### `POST /api/auth/login`
Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "alex@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK` + HttpOnly Cookie
```json
{
  "message": "Login successful",
  "username": "commander_alex"
}
```

---

#### `POST /api/auth/logout`
Clear authentication token.

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### User Endpoints

#### `GET /api/users/stats/:username`
Get win/loss statistics for a player.

**Headers:** `Cookie: token=<jwt>`

**Response:** `200 OK`
```json
{
  "wins": "5",
  "losses": "3",
  "total_games": "8"
}
```

---

#### `GET /api/users/search?query=alex`
Search for players by username.

**Headers:** `Cookie: token=<jwt>`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "username": "commander_alex",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### News Endpoints

#### `GET /api/news`
Retrieve all news articles.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Server Maintenance",
    "content": "Scheduled downtime on Saturday...",
    "created_at": "2024-01-20T14:00:00.000Z"
  }
]
```

---

#### `POST /api/news`
Create a new news article (Admin only).

**Headers:** `Cookie: token=<jwt>`

**Request Body:**
```json
{
  "title": "New Feature Released",
  "content": "We've added a new ship type..."
}
```

---

### Admin Endpoints

All admin endpoints require authentication middleware (`protect`).

#### `GET /api/admin/games`
Retrieve all game history records.

---

#### `DELETE /api/admin/games/:id`
Delete a specific game record.

---

#### `GET /api/admin/reports`
Get all admin board reports.

---

#### `POST /api/admin/reports`
Create a new admin report.

---

## Communication Protocols

### WebSocket Events (Socket.io)

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `check_room_availability` | `{roomId, username}` | Check if room can be joined |
| `join_room` | `{roomId, username}` | Join a game room |
| `ready_to_play` | `{roomId, board[10][10]}` | Submit ship placement |
| `fire` | `{roomId, r, c}` | Fire shot at coordinate |
| `send_message` | `{roomId, username, message}` | Send chat message |
| `typing` | `{roomId, username}` | Broadcast typing indicator |
| `request_chat_history` | `roomId` | Load previous messages |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `player_joined` | `{message}` | Notify of new player |
| `game_start` | `{turn}` | Game begins, announce first turn |
| `update_game` | `{r, c, result, shooter, nextTurn, sunkShip, gameOver}` | Shot result and state update |
| `receive_message` | `{username, message, time}` | New chat message |
| `display_typing` | `{username}` | Opponent is typing |
| `chat_history` | `[messages]` | Historical chat messages |
| `error_message` | `{message}` | Error notification |

---

### MQTT Topics

| Topic | Direction | QoS | Payload | Purpose |
|-------|-----------|-----|---------|---------|
| `battleship/status/dashboard` | Backend → Clients | 0 | `{onlinePlayers, activeRooms, uptime}` | Real-time server telemetry |
| `battleship/global/news` | Backend → Clients | 0 | String | Game events feed |
| `battleship/global/chat` | Clients ↔ Clients | 0 | `{username, message, time}` | Public lobby chat |
| `battleship/admin/alert` | Admin → Clients | 0 | String | System-wide notifications |

---

## Database Schema

### Tables

#### `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(250) NOT NULL,  -- bcrypt hash
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `games_history`
```sql
CREATE TABLE games_history (
  id SERIAL PRIMARY KEY,
  winner_username VARCHAR(50) NOT NULL,
  loser_username VARCHAR(50) NOT NULL,
  finish_reason VARCHAR(20) NOT NULL,  -- 'destruction' or 'forfeit'
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `reports`
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `news`
```sql
CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Security

### Implemented Measures

1. **Authentication**
   - JWT tokens with configurable expiration
   - HttpOnly cookies preventing XSS attacks
   - Secure cookie flag in production (HTTPS)

2. **Password Security**
   - bcrypt hashing with salt rounds
   - No plaintext passwords stored or logged

3. **HTTP Security**
   - Helmet.js for security headers
   - CORS configured for specific origin
   - CSRF protection via SameSite cookies

4. **Input Validation**
   - Formik + Yup schema validation on client
   - Server-side validation for all inputs
   - SQL injection prevention via parameterized queries

5. **Authorization**
   - Protected routes with authentication middleware
   - Admin endpoints accessible only to authenticated users
   - Session validation on every protected request

6. **Audit Trail**
   - Morgan logging to `access.log`
   - All HTTP requests logged with timestamps
   - Game history persisted in database

---
