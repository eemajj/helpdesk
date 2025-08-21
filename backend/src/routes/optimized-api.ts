/**
 * ⚡ Ultra-Optimized API Routes
 * DWF Helpdesk High-Performance API Implementation
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  cacheMiddleware, 
  optimizeDbQueries,
  performanceMetrics 
} from '../middleware/performance.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// 📊 Ultra-Fast Dashboard Statistics
router.get('/dashboard/stats', 
  authMiddleware,
  cacheMiddleware(60000), // 1 minute cache
  optimizeDbQueries,
  async (req, res) => {
    try {
      // Use the optimized database function
      const stats = await prisma.$queryRaw`SELECT * FROM get_dashboard_stats()` as any[];
      
      if (stats.length > 0) {
        const result = stats[0];
        return res.json({
          totalTickets: parseInt(result.total_tickets),
          pendingTickets: parseInt(result.pending_tickets),
          inProgressTickets: parseInt(result.in_progress_tickets),
          completedTickets: parseInt(result.completed_tickets),
          todayTickets: parseInt(result.today_tickets),
          avgResolutionHours: parseFloat(result.avg_resolution_hours) || 0
        });
      }
      
      // Fallback to regular query if function fails
      const [total, pending, inProgress, completed, today] = await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: 'รอดำเนินการ' } }),
        prisma.ticket.count({ where: { status: 'กำลังดำเนินการ' } }),
        prisma.ticket.count({ where: { status: 'เสร็จสิ้น' } }),
        prisma.ticket.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ]);
      
      res.json({
        totalTickets: total,
        pendingTickets: pending,
        inProgressTickets: inProgress,
        completedTickets: completed,
        todayTickets: today,
        avgResolutionHours: 0
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  }
);

// 🎯 Optimized Active Tickets Summary
router.get('/dashboard/active-summary',
  authMiddleware,
  cacheMiddleware(120000), // 2 minutes cache
  async (req, res) => {
    try {
      const summary = await prisma.$queryRaw`SELECT * FROM active_tickets_summary`;
      res.json(summary);
    } catch (error) {
      console.error('Active summary error:', error);
      res.status(500).json({ error: 'Failed to fetch active summary' });
    }
  }
);

// 🏢 Department Performance View
router.get('/dashboard/department-performance',
  authMiddleware,
  cacheMiddleware(300000), // 5 minutes cache
  async (req, res) => {
    try {
      const performance = await prisma.$queryRaw`SELECT * FROM department_performance`;
      res.json(performance);
    } catch (error) {
      console.error('Department performance error:', error);
      res.status(500).json({ error: 'Failed to fetch department performance' });
    }
  }
);

// 👥 User Workload Distribution
router.get('/dashboard/user-workload',
  authMiddleware,
  cacheMiddleware(60000), // 1 minute cache
  async (req, res) => {
    try {
      const workload = await prisma.$queryRaw`SELECT * FROM user_workload`;
      res.json(workload);
    } catch (error) {
      console.error('User workload error:', error);
      res.status(500).json({ error: 'Failed to fetch user workload' });
    }
  }
);

// 🔍 Ultra-Fast Search with Full-Text
router.get('/search/tickets',
  authMiddleware,
  cacheMiddleware(30000), // 30 seconds cache
  async (req, res) => {
    try {
      const { q, limit = 20, offset = 0 } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
      }
      
      const searchTerm = q.trim();
      const searchLimit = Math.min(parseInt(limit as string) || 20, 100);
      const searchOffset = parseInt(offset as string) || 0;
      
      // Use optimized full-text search function
      const results = await prisma.$queryRaw`
        SELECT * FROM search_tickets(${searchTerm})
        LIMIT ${searchLimit} OFFSET ${searchOffset}
      ` as any[];
      
      res.json({
        results,
        pagination: {
          limit: searchLimit,
          offset: searchOffset,
          hasMore: results.length === searchLimit
        }
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  }
);

// 📈 Real-time Performance Metrics
router.get('/system/metrics',
  authMiddleware,
  async (req, res) => {
    try {
      const metrics = performanceMetrics.getMetrics();
      const dbStats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC
      `;
      
      res.json({
        api: metrics,
        database: dbStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  }
);

// 🧹 Cache Management
router.post('/system/cache/clear',
  authMiddleware,
  async (req, res) => {
    try {
      const { user } = req as any;
      
      // Only allow admin users to clear cache
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const { cacheMiddleware } = await import('../middleware/performance.js');
      const { apiCache } = await import('../middleware/performance.js');
      
      apiCache.clear();
      
      res.json({ 
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Cache clear error:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  }
);

// 📋 Optimized Ticket List with Pagination
router.get('/tickets',
  authMiddleware,
  cacheMiddleware(30000), // 30 seconds cache
  optimizeDbQueries,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        priority, 
        department,
        assignedTo 
      } = req.query;
      
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
      const skip = (pageNum - 1) * limitNum;
      
      // Build where clause dynamically
      const where: any = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (department) where.department = department;
      if (assignedTo) where.assignedToId = parseInt(assignedTo as string);
      
      // Use optimized query with indexes
      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          select: {
            id: true,
            ticketId: true,
            problemType: true,
            problemDescription: true,
            fullName: true,
            department: true,
            status: true,
            priority: true,
            createdAt: true,
            assignedTo: {
              select: {
                id: true,
                fullName: true
              }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limitNum
        }),
        // Only count if specifically requested (expensive operation)
        req.query.includeCount === 'true' ? prisma.ticket.count({ where }) : 0
      ]);
      
      res.json({
        tickets,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: req.query.includeCount === 'true' ? total : undefined,
          hasMore: tickets.length === limitNum
        }
      });
    } catch (error) {
      console.error('Tickets list error:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  }
);

// 🔄 Database Maintenance Endpoints
router.post('/system/maintenance/cleanup',
  authMiddleware,
  async (req, res) => {
    try {
      const { user } = req as any;
      
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      // Run cleanup functions
      const [notificationsDeleted, passwordResetsDeleted] = await Promise.all([
        prisma.$queryRaw`SELECT cleanup_old_notifications()` as any[],
        prisma.$queryRaw`SELECT cleanup_expired_password_resets()` as any[]
      ]);
      
      res.json({
        message: 'Database cleanup completed',
        results: {
          notificationsDeleted: notificationsDeleted[0]?.cleanup_old_notifications || 0,
          passwordResetsDeleted: passwordResetsDeleted[0]?.cleanup_expired_password_resets || 0
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({ error: 'Database cleanup failed' });
    }
  }
);

export default router;