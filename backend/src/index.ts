
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const port = parseInt(process.env.PORT || '3002');

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));
app.use(express.json());

// A simple, guaranteed-to-work health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'DWF Helpdesk API is running in a simplified recovery mode.',
    status: 'ok',
  });
});

// All problematic routes are temporarily disabled to ensure a stable start.
// We will re-introduce them one by one.

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Backend is running in recovery mode on http://localhost:${port}`);
});

export default app;
