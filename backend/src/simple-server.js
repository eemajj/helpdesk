// JavaScript server สำเร็จรูป
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Simple Server Works!',
    path: req.url,
    method: req.method
  }));
});

const port = 3001;
server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Simple HTTP Server listening on ALL interfaces port ${port}`);
});

server.on('error', (err) => {
  console.error('❌ Server Error:', err);
});