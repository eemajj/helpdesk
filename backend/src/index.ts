import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { disconnectPrisma } from './db/connection'

// Import routes
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users-express'
import { ticketRoutes } from './routes/tickets-express'

const app = express()
const port = parseInt(process.env.PORT || '3001')

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
    message: 'DWF Helpdesk API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/users', userRoutes)

// Health check for WebSocket status
app.get('/api/ws/status', (req, res) => {
  res.json({
    success: true,
    websocket: {
      connected: 0,
      clients_by_role: {}
    }
  })
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

import { websocketService } from './services/websocketService'

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 DWF Helpdesk API starting on port ${port}`)
  console.log(`✅ Server running on http://localhost:${port}`)
  websocketService.initialize(server)
})

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`)
  
  server.close(async () => {
    console.log('📡 HTTP server closed')
    
    try {
      await disconnectPrisma()
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