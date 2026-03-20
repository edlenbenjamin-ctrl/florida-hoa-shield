const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Auto-generate JWT_SECRET if not set (tokens will invalidate on restart)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = require('crypto').randomBytes(64).toString('hex');
  console.warn('WARNING: JWT_SECRET not set — auto-generated. Set JWT_SECRET in environment for persistent tokens.');
}

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const violationRoutes = require('./routes/violations');
const documentRoutes = require('./routes/documents');
const financialRoutes = require('./routes/financials');
const announcementRoutes = require('./routes/announcements');
const votingRoutes = require('./routes/voting');
const paymentRoutes = require('./routes/payments');
const subscriptionRoutes = require('./routes/subscription');

const app = express();
const PORT = process.env.PORT || 3001;

const defaultOrigins = [
  'http://localhost:3000',
  'https://florida-hoa-shield.vercel.app',
  'https://floridahoashield.com',
  'https://www.floridahoashield.com',
];
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : defaultOrigins;
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Stripe webhooks need raw body — mount before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/financials', financialRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB (use in-memory server in dev if no URI provided)
async function startServer() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    if (process.env.NODE_ENV === 'production') {
      console.warn('WARNING: MONGODB_URI not set — using in-memory database. Data will not persist across restarts.');
      console.warn('Set MONGODB_URI in Render dashboard to use a persistent MongoDB Atlas database.');
    } else {
      console.log('Using in-memory MongoDB (no MONGODB_URI set)');
    }
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer().catch((err) => {
  console.error('Startup error:', err.message);
  process.exit(1);
});

module.exports = app;
