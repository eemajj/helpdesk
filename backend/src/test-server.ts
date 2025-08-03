// backend/src/test-server.ts
import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
});

const port = 8080;
server.listen(port, () => {
  console.log(`[test-server]: เซิร์ฟเวอร์พื้นฐานกำลังทำงานที่ http://localhost:${port}`);
});