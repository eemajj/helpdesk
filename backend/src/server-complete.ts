import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { generalLimiter } from './middleware/rateLimiter'
import { prisma } from './db/connection'

// Import Express routes
import { authRoutes } from './routes/auth'
import { userRoutes as userProfileRoutes } from './routes/users-express'
import { ticketRoutes } from './routes/tickets-express'
import { dashboardRoutes } from './routes/dashboard-express'
import adminRoutes from './routes/admin'
import { userRoutes } from './routes/user'
import { websocketService } from './services/websocketService'
import { tokenBlacklist } from './services/tokenBlacklist'
import { cleanupOldFiles } from './middleware/fileUpload'

// ⚡ Ultra Performance & Security Imports
import { 
  securityHeaders, 
  apiRateLimit, 
  corsOptions,
  sanitizeInput,
  sqlInjectionProtection,
  productionSecurityCheck
} from './middleware/security.js'
import {
  responseTimeMonitor,
  smartCompression,
  performanceMonitoring,
  staticAssetOptimization,
  requestSizeLimiter
} from './middleware/performance.js'
import optimizedApiRouter from './routes/optimized-api.js'

// Import Swagger configuration
import { swaggerSpec, swaggerUi, swaggerUiOptions } from './swagger/swagger.config';

const app = express();
const port = parseInt(process.env.PORT || '3002');

// ⚡ ULTRA PERFORMANCE & SECURITY SETUP
app.set('trust proxy', 1);

// 🔒 Advanced Security Middleware
app.use(productionSecurityCheck);
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(sqlInjectionProtection);

// 🚦 Smart Rate Limiting
app.use('/api/', apiRateLimit);
app.use(generalLimiter);

// ⚡ Performance Optimization Middleware
app.use(responseTimeMonitor);
app.use(performanceMonitoring);
app.use(smartCompression);
app.use(staticAssetOptimization);
app.use(requestSizeLimiter(10 * 1024 * 1024)); // 10MB limit

// Logging middleware
app.use(morgan('combined'))

// 🌐 Ultra-Secure CORS Configuration
app.use(cors(corsOptions));

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

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions))

// ⚡ ULTRA-OPTIMIZED API ROUTES
app.use('/api/v2', optimizedApiRouter); // New optimized endpoints

// Standard API routes (legacy support)
app.use('/api/auth', authRoutes)
app.use('/api/users', userProfileRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/user', userRoutes)

// Categories endpoint (for ticket creation form)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true
      }
    })
    
    res.json({
      success: true,
      categories
    })
  } catch (error) {
    console.error('Get categories error:', error)
    // Fallback to hardcoded data if database fails
    const fallbackCategories = [
      { id: 1, name: 'ฮาร์ดแวร์', description: 'ปัญหาเกี่ยวกับฮาร์ดแวร์คอมพิวเตอร์' },
      { id: 2, name: 'ซอฟต์แวร์', description: 'ปัญหาเกี่ยวกับซอฟต์แวร์และโปรแกรม' },
      { id: 3, name: 'เครือข่าย', description: 'ปัญหาเกี่ยวกับอินเทอร์เน็ตและเครือข่าย' },
      { id: 4, name: 'เครื่องพิมพ์', description: 'ปัญหาเกี่ยวกับเครื่องพิมพ์และอุปกรณ์พิมพ์' },
      { id: 5, name: 'โทรศัพท์', description: 'ปัญหาเกี่ยวกับระบบโทรศัพท์' },
      { id: 6, name: 'อีเมล', description: 'ปัญหาเกี่ยวกับระบบอีเมล' },
      { id: 7, name: 'ระบบงาน', description: 'ปัญหาเกี่ยวกับระบบงานต่างๆ' },
      { id: 8, name: 'ไวรัส', description: 'ปัญหาเกี่ยวกับไวรัสและมัลแวร์' },
      { id: 9, name: 'สำรองข้อมูล', description: 'ปัญหาเกี่ยวกับการสำรองข้อมูล' },
      { id: 10, name: 'การอบรม', description: 'ขอการอบรมและสนับสนุน' },
      { id: 11, name: 'อื่นๆ', description: 'ปัญหาอื่นๆ ที่ไม่อยู่ในหมวดหมู่ข้างต้น' }
    ]
    
    res.json({
      success: true,
      categories: fallbackCategories
    })
  }
})

// Priorities endpoint (for ticket creation form)
app.get('/api/priorities', async (req, res) => {
  try {
    const priorities = await prisma.priority.findMany({
      where: { isActive: true },
      orderBy: { level: 'desc' },
      select: {
        id: true,
        name: true,
        level: true,
        description: true,
        slaHours: true,
        color: true
      }
    })
    
    res.json({
      success: true,
      priorities
    })
  } catch (error) {
    console.error('Get priorities error:', error)
    // Fallback to hardcoded data if database fails (converted to minutes for testing)
    const fallbackPriorities = [
      { id: 1, name: 'วิกฤต', level: 8, description: 'ต้องแก้ไขทันที (5 นาที)', slaHours: 1, slaMinutes: 5, color: '#dc2626' },
      { id: 2, name: 'เร่งด่วนมาก', level: 7, description: 'แก้ไขภายใน 10 นาที', slaHours: 2, slaMinutes: 10, color: '#ea580c' },
      { id: 3, name: 'เร่งด่วน', level: 6, description: 'แก้ไขภายใน 15 นาที', slaHours: 4, slaMinutes: 15, color: '#d97706' },
      { id: 4, name: 'สูง', level: 5, description: 'แก้ไขภายใน 30 นาที', slaHours: 8, slaMinutes: 30, color: '#ca8a04' },
      { id: 5, name: 'ปกติ', level: 4, description: 'แก้ไขภายใน 60 นาที', slaHours: 24, slaMinutes: 60, color: '#16a34a' },
      { id: 6, name: 'ต่ำ', level: 3, description: 'แก้ไขภายใน 2 ชั่วโมง', slaHours: 48, slaMinutes: 120, color: '#0d9488' },
      { id: 7, name: 'ต่ำมาก', level: 2, description: 'แก้ไขภายใน 4 ชั่วโมง', slaHours: 72, slaMinutes: 240, color: '#0891b2' },
      { id: 8, name: 'ต่ำสุด', level: 1, description: 'แก้ไขภายใน 1 วัน', slaHours: 168, slaMinutes: 1440, color: '#6b7280' }
    ]
    
    res.json({
      success: true,
      priorities: fallbackPriorities
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
const server = app.listen(port, () => {
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
  console.log(`   GET  /api-docs             - Swagger API Documentation`);
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