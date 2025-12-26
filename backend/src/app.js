// express framework to create HTTP server and routes
const express = require('express');

// middleware to allow requests from other origins (frontend)
const cors = require('cors');

// middleware that adds basic security HTTP headers
const helmet = require('helmet');

// HTTP request logger (shows requests in console)
const morgan = require('morgan');

// loads environment variables from .env file into process.env
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});