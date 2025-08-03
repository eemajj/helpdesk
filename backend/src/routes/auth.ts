import { Router, Request, Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/connection'
import { authMiddleware } from '../middleware/auth'

export const authRoutes = Router()

const LoginSchema = z.object({
  username: z.string().min(1, 'กรุณาระบุชื่อผู้ใช้'),
  password: z.string().min(1, 'กรุณาระบุรหัสผ่าน')
})

const generateTokens = (userId: number, username: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, username, role },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  )
  
  const refreshToken = jwt.sign(
    { userId, username, role },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  )
  
  return { accessToken, refreshToken }
}

// Login endpoint
authRoutes.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = LoginSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ข้อมูลไม่ถูกต้อง',
        details: validation.error.issues
      })
    }

    const { username, password } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true,
        fullName: true,
        email: true,
        isActive: true
      }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'บัญชีผู้ใช้ถูกระงับ'
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      })
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.username, user.role)

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email
      },
      accessToken,
      refreshToken
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
    })
  }
})

// Refresh token endpoint
authRoutes.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'ไม่พบ Refresh Token'
      })
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'ผู้ใช้ไม่พบหรือถูกระงับ'
      })
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.username, user.role)

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    })

  } catch (error) {
    console.error('Refresh token error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Refresh Token ไม่ถูกต้อง'
      })
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Refresh Token หมดอายุ กรุณาเข้าสู่ระบบใหม่'
      })
    }

    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการต่ออายุ Token'
    })
  }
})

// Logout endpoint (client-side token removal)
authRoutes.post('/logout', authMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'ออกจากระบบสำเร็จ'
  })
})

// Verify token endpoint
authRoutes.get('/verify', authMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user
  })
})