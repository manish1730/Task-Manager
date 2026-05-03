const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const app = require('./app');

connectDB();

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
