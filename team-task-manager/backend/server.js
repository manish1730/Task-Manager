const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

const app = express();

// ✅ ADD CORS HERE
app.use(cors({
  origin: "*"
}));

// ✅ Body parser (keep this)
app.use(express.json());

// routes
app.get('/', (req, res) => {
  res.json({ message: 'Team Task Manager API is running ✅' });
});