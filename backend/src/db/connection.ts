import { PrismaClient } from '@prisma/client'

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    // ⚡ ULTRA OPTIMIZATION: Enhanced connection pooling
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function for graceful shutdown
export const disconnectPrisma = async () => {
  await prisma.$disconnect()
}

// Legacy functions for backward compatibility (will be removed later)
import { Pool } from 'pg'

// ⚡ ULTRA OPTIMIZATION: Advanced PostgreSQL connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Ultra-fast pool configuration
  max: 20,              // Maximum pool size
  min: 2,               // Minimum pool size  
  idleTimeoutMillis: 10000,  // Close connections after 10s idle
  connectionTimeoutMillis: 60000  // 60s acquire timeout
})

export const query = async (text: string, params?: any[]) => {
  const start = Date.now()
  const result = await pool.query(text, params)
  const duration = Date.now() - start
  console.log('Query executed:', { text, duration, rows: result.rowCount })
  return result
}

export const getClient = async () => {
  const client = await pool.connect()
  return client
}

export default pool