import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { prisma } from './db/connection'
import { userRoutes } from './routes/users-express'

const app = express()
const port = 3001

// CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}))

// Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'DWF Helpdesk API with Bun + Express + Prisma',
    version: '1.0.0',
    status: 'running',
    runtime: 'Bun',
    timestamp: new Date().toISOString()
  })
})

// Test Prisma connection
app.get('/api/test/db', async (req, res) => {
  try {
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
    console.error('Database test error:', error)
    res.status(500).json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// API routes
app.use('/api/users', userRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 DWF Express + Prisma server starting on port ${port}`)
  console.log(`✅ Server running on http://localhost:${port}`)
  console.log(`🏃‍♂️ Runtime: Bun v${process.versions.bun || 'Unknown'}`)
})

export default app