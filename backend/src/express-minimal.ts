// Express แบบง่ายที่สุด ไม่มี middleware
import express from 'express';

const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('Express Minimal Works!');
});

app.listen(port, '127.0.0.1', (err?: Error) => {
  if (err) {
    console.error('❌ Express Error:', err);
    return;
  }
  console.log(`✅ Express minimal server SUCCESSFULLY listening on http://localhost:${port}`);
});

// เพิ่ม error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});