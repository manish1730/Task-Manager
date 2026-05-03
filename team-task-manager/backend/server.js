const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const app = require('./app');

connectDB();

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
