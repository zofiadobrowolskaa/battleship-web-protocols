**Battleship Real-Time Multiplayer**

A high-performance, real-time Battleship game featuring multi-protocol communication, secure authentication, and a responsive tactical interface. This project explores the synergy between WebSockets for gameplay, MQTT for system-wide telemetry, and REST API for user management.

**Tech Stack:**
* **Frontend** - React, Vite, SCSS, Socket.io-client, MQTT.js
* **Backend** - Node.js, Express, Socket.io, MQTT,
* **Database** - PostgreSQL
* **Protocols** - HTTP/REST, WebSockets (WS), MQTT
* **Security** - JSON Web Tokens, Bcrypt, Helmet, Cookie-parser

**Core Features:**

**1. Real-Time Communication**
* **WebSockets (Socket.IO):** Powers the core gameplay loop, including shot synchronization, turn management, and instant in-game messaging.

* **MQTT (HiveMQ):** Implements a global "Battle Feed" and live server telemetry dashboard. It broadcasts tactical updates (e.g., ships sinking) to all players in the lobby.

2. **Secure Infrastructure**
* **JWT & HttpOnly Cookies:** Industry-standard authentication flow protecting user sessions from XSS and CSRF attacks.

* **Bcrypt Hashing:** All user credentials are encrypted before storage in the PostgreSQL database.

* **Audit Logging:** Integrated morgan with a custom file-system stream to maintain a persistent access.log of all network traffic.

3. **Gameplay & UX**
* **Tactical Search:** A REST-compliant search engine using PostgreSQL ILIKE patterns to find and inspect other commanders' statistics.

* **Ship Deployment:** Advanced grid system with adjacency validation (ships cannot touch) and responsive scaling for mobile devices.

* **Responsive SCSS:** A modular styling architecture using Media Queries.
