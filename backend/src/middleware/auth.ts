import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
// UserRole type definition
type UserRole = 'admin' | 'support' | 'user'
import { prisma } from '../db/connection'
import { tokenBlacklist } from '../services/tokenBlacklist'
import { ultraCache, getCachedUser } from './ultraCache'

export interface AuthUser {
  userId: number
  username: string
  role: UserRole
  fullName: string
  email?: string
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorization = req.headers.authorization
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'ไม่พบ Access Token' })
    }

    const token = authorization.split(' ')[1]
    
    // Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      return res.status(401).json({ error: 'Access Token ถูกยกเลิกแล้ว กรุณาเข้าสู่ระบบใหม่' })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // ตรวจสอบว่า token มีข้อมูลที่จำเป็น
    if (!decoded.userId || !decoded.username) {
      return res.status(401).json({ error: 'Access Token ไม่ถูกต้อง' })
    }

    // ✅ ULTRA OPTIMIZATION: ใช้ cached user data แทนการ query DB ทุกครั้ง
    let user = ultraCache.getUser(decoded.userId);
    
    if (!user) {
      // เมื่อไม่มีใน cache จึงค่อย query database
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          role: true,
          fullName: true,
          email: true,
          isActive: true,
          autoAssignEnabled: true,
          lastLogin: true,
        }
      });
      
      if (user) {
        // Cache user data for 5 minutes
        ultraCache.setUser(user.id, user, 300);
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'ผู้ใช้ไม่พบหรือถูกระงับ' })
    }

    // Check if all user tokens are blacklisted (for password changes, etc.)
    if (tokenBlacklist.isUserBlacklisted(user.id)) {
      return res.status(401).json({ error: 'โทเค็นถูกยกเลิกแล้ว กรุณาเข้าสู่ระบบใหม่' })
    }

    // เก็บข้อมูล user ใน request เพื่อให้ routes อื่นใช้ได้
    req.user = {
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      email: user.email || undefined
    }

    next()

  } catch (error) {
    console.error('Auth middleware error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Access Token ไม่ถูกต้อง' })
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Access Token หมดอายุ กรุณาเข้าสู่ระบบใหม่' })
    }
    
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' })
  }
}

// Middleware สำหรับตรวจสอบ role
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'ไม่พบข้อมูลผู้ใช้' })
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้' })
    }
    
    next()
  }
}

// Middleware สำหรับ admin เท่านั้น
export const requireAdmin = requireRole(['admin'])

// Middleware สำหรับ support และ admin
export const requireSupport = requireRole(['admin', 'support'])