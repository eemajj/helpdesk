// backend/src/express-test.ts (เวอร์ชันชั่วคราวสำหรับดีบัก)
import express, { Express, Request, Response } from 'express';
import cors from 'cors';

const app: Express = express();
const port = 8081;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Express Server ตอบสนองแล้ว!');
});

// คอมเมนต์ Routes ทั้งหมดออกไปก่อน
// app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`[server]: Express server กำลังทำงานที่ http://localhost:${port}`);
});