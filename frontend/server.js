import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import httpProxy from 'http-proxy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_API_BASE_URL || 'https://restaurantos-backend-wg6g.onrender.com/api';
const BACKEND_BASE = BACKEND_URL.endsWith('/api') ? BACKEND_URL.replace('/api', '') : BACKEND_URL;

console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Backend Base: ${BACKEND_BASE}`);

// Create proxy
const proxy = httpProxy.createProxyServer({
  target: BACKEND_BASE,
  changeOrigin: true,
  followRedirects: true
});

// Proxy API requests to backend
app.use('/api', (req, res) => {
  proxy.web(req, res);
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server listening on port ${PORT}`);
  console.log(`Proxying /api requests to ${BACKEND_BASE}`);
});
