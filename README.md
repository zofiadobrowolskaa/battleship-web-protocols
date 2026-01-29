**Battleship Real-Time Multiplayer**

A high-performance, real-time Battleship game featuring multi-protocol communication, secure authentication, and a responsive tactical interface. This project explores the synergy between WebSockets for gameplay, MQTT for system-wide telemetry, and REST API for user management.

**Tech Stack:**
* **Frontend** - React, Vite, SCSS, Socket.io-client, MQTT.js
* **Backend** - Node.js, Express, Socket.io, MQTT
* **Database** - PostgreSQL
* **Protocols** - HTTP/REST, WebSockets (WS), MQTT
* **Security** - JSON Web Tokens, Bcrypt, Helmet, Cookie-parser

**Core Features:**

**1. Real-Time Communication**
* **WebSockets (Socket.IO):** Powers the core gameplay loop, including shot synchronization, turn management, and instant in-game messaging.

* **MQTT (HiveMQ):**

 - ```battleship/status/dashboard```: Real-time server metrics (online players, active rooms, uptime).
 - ```battleship/global/news```: Global notifications about game starts, players joining rooms, and tactical achievements like sinking ships or victories.

**2. Secure Infrastructure**
* **JWT & HttpOnly Cookies:** Industry-standard authentication flow protecting user sessions from XSS and CSRF attacks.

* **Bcrypt Hashing:** All user credentials are encrypted before storage in the PostgreSQL database.

* **Audit Logging:** Integrated morgan with a custom file-system stream to maintain a persistent access.log of all network traffic.

**3. Gameplay & UX**
* **Tactical Search:** A REST-compliant search engine using PostgreSQL ILIKE patterns to find and inspect other commanders' statistics.

* **Ship Deployment:** Advanced grid system with adjacency validation (ships cannot touch) and responsive scaling for mobile devices.

* **Forfeit System:** Automatically handles disconnections by awarding victory to the remaining player if a match was in progress.

* **Responsive SCSS:** A modular styling architecture using Media Queries.

 **Project Structure**

* **/backend**: Node.js server handling game logic, database interactions, and MQTT broadcasts.

* **/frontend**: React application with tactical interface and ship placement mechanics.

 **Installation & Setup**

**Prerequisites**

* Node.js (v18 or higher)
* PostgreSQL database
* HiveMQ Cloud account (or other MQTT broker)

**1. Database Configuration**

Create a PostgreSQL database named ```battleship_db```. The application will automatically initialize the required tables on the first server start.

**2. Environment Variables**

You must create two separate ```.env``` files in their respective directories to ensure both Vite and Node.js can access the configuration.

Create ```.env``` in both ```backend``` and ```frontend``` folders:

```
PORT=5000
DB_NAME=battleship_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_DIALECT=postgres
JWT_SECRET=your_secret_key
VITE_MQTT_HOST=your_mqtt_host
VITE_MQTT_USER=your_mqtt_username
VITE_MQTT_PASS=your_mqtt_password
```

**3. Backend Setup**

```bash
cd backend
npm install
node src/server.js
```

**4. Frontend Setup**

```bash
cd frontend
npm install
npm run dev # starts the development server at http://localhost:5173
```
