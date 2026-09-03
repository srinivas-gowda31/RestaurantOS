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
  followRedirects: true,
  pathRewrite: (path, req) => {
    // Preserve /api in the forwarded request
    return path;
  }
});

// Proxy API requests to backend
app.use('/api', (req, res) => {
  proxy.web(req, res, (err) => {
    if (err) {
      console.error('Proxy error:', err.message);
      res.status(502).json({ error: 'Backend unreachable', detail: err.message });
    }
  });
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
