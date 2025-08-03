// Pure Node.js server - แก้ปัญหา Express network binding
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3002;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'DWF Helpdesk API - Node.js Server',
      version: '1.0.0',
      status: 'running',
      runtime: 'Node.js Pure HTTP',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // API routes
  if (parsedUrl.pathname.startsWith('/api')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'API endpoint placeholder',
      endpoint: parsedUrl.pathname,
      method: method
    }));
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 DWF Node.js Server starting on port ${PORT}`);
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🏃‍♂️ Runtime: Node.js v${process.version}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is in use. Trying port ${PORT + 1}...`);
    server.listen(PORT + 1, '127.0.0.1');
  } else {
    console.error('❌ Server error:', err);
  }
});