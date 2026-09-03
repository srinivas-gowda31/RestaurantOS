const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL.replace('/api', ''),
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  }
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server listening on port ${PORT}`);
  console.log(`Proxying /api requests to ${BACKEND_URL.replace('/api', '')}`);
});
