const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

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

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));

// Stripe webhooks need raw body — mount before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(morgan('dev'));

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

// Connect to MongoDB (use in-memory server if no URI provided)
async function startServer() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log('Using in-memory MongoDB (no MONGODB_URI set)');
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});

module.exports = app;
