// ลองใช้ http.createServer กับ Express app
import express from 'express';
import http from 'http';

const app = express();
const port = 8083;

app.get('/', (req, res) => {
  res.send('Express via HTTP Server Works!');
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`✅ Express via HTTP Server listening on http://localhost:${port}`);
});

server.on('error', (err) => {
  console.error('❌ Server Error:', err);
});