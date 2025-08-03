import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { prisma } from './db/connection'

// Import Express routes
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users-express'
import { ticketRoutes } from './routes/tickets-express'
import { dashboardRoutes } from './routes/dashboard-express';
import { websocketService } from './services/websocketService';

const app = express();
const port = parseInt(process.env.PORT || '8080');

// Security middleware
app.use(helmet())

// Logging middleware
app.use(morgan('combined'))

// CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'DWF Helpdesk API - Complete System',
    version: '1.0.0',
    status: 'running',
    runtime: 'Bun + Express + Prisma',
    timestamp: new Date().toISOString()
  })
})

// Database health check
app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$connect()
    const userCount = await prisma.user.count()
    const ticketCount = await prisma.ticket.count()
    
    res.json({
      success: true,
      database: 'connected',
      stats: {
        users: userCount,
        tickets: ticketCount
      }
    })
  } catch (error) {
    console.error('Database health check error:', error)
    res.status(500).json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Categories endpoint (for ticket creation form)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' }
    })
    
    res.json({
      success: true,
      categories
    })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่'
    })
  }
})

// Priorities endpoint (for ticket creation form)
app.get('/api/priorities', async (req, res) => {
  try {
    const priorities = await prisma.priority.findMany({
      orderBy: { level: 'desc' }
    })
    
    res.json({
      success: true,
      priorities
    })
  } catch (error) {
    console.error('Get priorities error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลระดับความสำคัญ'
    })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 DWF Helpdesk Complete API starting on port ${port}`);
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`🏃‍♂️ Runtime: Bun v${process.versions.bun || 'Unknown'}`);
  console.log(`📊 Available routes:`);
  console.log(`   GET  /                     - Health check`);
  console.log(`   GET  /api/health/db        - Database health`);
  console.log(`   POST /api/auth/login       - User login`);
  console.log(`   POST /api/auth/refresh     - Refresh token`);
  console.log(`   GET  /api/auth/verify      - Verify token`);
  console.log(`   POST /api/tickets          - Create ticket (public)`);
  console.log(`   GET  /api/tickets          - List tickets (auth)`);
  console.log(`   GET  /api/users/profile    - User profile (auth)`);
  console.log(`   GET  /api/categories       - Ticket categories`);
  console.log(`   GET  /api/priorities       - Ticket priorities`);
});

// Initialize WebSocket Server AFTER server starts
websocketService.initialize(server);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`)
  
  server.close(async () => {
    console.log('📡 HTTP server closed')
    
    try {
      await prisma.$disconnect()
      console.log('🗄️ Database connections closed')
    } catch (error) {
      console.error('❌ Error closing database connections:', error)
    }
    
    process.exit(0)
  })
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export default app