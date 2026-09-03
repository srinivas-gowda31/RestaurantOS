import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import httpProxy from 'http-proxy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || process.env.VITE_API_BASE_URL || 'https://restaurantos-backend-wg6g.onrender.com';

console.log(`Backend URL: ${BACKEND_URL}`);

// Create proxy - forward everything to backend as-is
const proxy = httpProxy.createProxyServer({
  target: BACKEND_URL,
  changeOrigin: true,
  followRedirects: true
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  res.status(502).json({ error: 'Backend unreachable', detail: err.message });
});

// Proxy ALL /api requests to backend, preserving the full path
app.use('/api', (req, res) => {
  proxy.web(req, res);
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all non-API routes, injecting API config
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  const fs = require('fs');
  let html = fs.readFileSync(indexPath, 'utf8');

  // Inject window.API_BASE_URL before the script tags
  const apiConfig = `<script>window.API_BASE_URL = '${BACKEND_URL}/api';</script>`;
  html = html.replace('</head>', apiConfig + '</head>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Frontend server listening on port ${PORT}`);
  console.log(`Proxying /api/* requests to ${BACKEND_URL}/api/*`);
});
