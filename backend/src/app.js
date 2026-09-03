require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const moduleRoutes = require('./routes/modules.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const aiRoutes = require('./routes/ai.routes');
const invoiceRoutes = require('./routes/invoices.routes');
const activityLogger = require('./middleware/activityLogger');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true // Enable credentials (cookies) with CORS
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cookieParser()); // Parse cookies
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'RestaurantOS API', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', activityLogger, dashboardRoutes);
app.use('/api/ai', activityLogger, aiRoutes);
app.use('/api/invoices', activityLogger, invoiceRoutes);
app.use('/api', activityLogger, moduleRoutes); // /api/tables, /api/menu-items, etc.

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Centralized error handler (catches thrown errors from async routes not already handled)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
