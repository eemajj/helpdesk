import { Router, Request, Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/connection'
import { authMiddleware } from '../middleware/auth'
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter'
import crypto from 'crypto'
import { tokenBlacklist } from '../services/tokenBlacklist'

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: ชื่อผู้ใช้
 *           example: admin
 *         password:
 *           type: string
 *           description: รหัสผ่าน
 *           example: admin123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: เข้าสู่ระบบสำเร็จ
 *         user:
 *           $ref: '#/components/schemas/User'
 *         accessToken:
 *           type: string
 *           description: JWT access token (expires in 1 hour)
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token (expires in 7 days)
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token
 *     PasswordResetRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: อีเมลของผู้ใช้
 *           example: user@dwf.go.th
 *     PasswordReset:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *       properties:
 *         token:
 *           type: string
 *           description: Reset token ที่ได้รับจากอีเมล
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: รหัสผ่านใหม่
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: รหัสผ่านปัจจุบัน
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: รหัสผ่านใหม่
 */

export const authRoutes = Router()

const LoginSchema = z.object({
  username: z.string().min(1, 'กรุณาระบุชื่อผู้ใช้'),
  password: z.string().min(1, 'กรุณาระบุรหัสผ่าน')
})

const PasswordResetRequestSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง')
})

const PasswordResetSchema = z.object({
  token: z.string().min(1, 'กรุณาระบุ token'),
  newPassword: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
})

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'กรุณาระบุรหัสผ่านปัจจุบัน'),
  newPassword: z.string().min(6, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: 🔑 User Login
 *     description: |
 *       ## 🏊‍♂️ Swimlane Flow:
 *       1. **User** → Submits username/password
 *       2. **System** → Validates credentials against database
 *       3. **System** → Generates JWT access & refresh tokens
 *       4. **System** → Updates user's last login timestamp
 *       5. **User** → Receives tokens for subsequent requests
 *       
 *       **Rate Limit**: 5 attempts per 15 minutes per IP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many attempts (Rate limited)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: เกิดข้อผิดพลาดในการเข้าสู่ระบบ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Login endpoint with rate limiting
authRoutes.post('/login', authLimiter, async (req: Request, res: Response) => {
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

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: 🔄 Refresh Access Token
 *     description: |
 *       ## 🏊‍♂️ Swimlane Flow:
 *       1. **User** → Submits refresh token
 *       2. **System** → Validates refresh token
 *       3. **System** → Verifies user is still active
 *       4. **System** → Generates new access & refresh tokens
 *       5. **User** → Receives new tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: 🚪 User Logout
 *     description: |
 *       ## 🏊‍♂️ Swimlane Flow:
 *       1. **User** → Requests logout with current token
 *       2. **System** → Validates JWT token
 *       3. **System** → Adds token to blacklist
 *       4. **System** → Confirms logout
 *       5. **User** → Receives logout confirmation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ออกจากระบบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized - Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Logout endpoint (blacklist current token)
authRoutes.post('/logout', authMiddleware, (req: Request, res: Response) => {
  try {
    const authorization = req.headers.authorization
    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.split(' ')[1]
      const user = req.user!
      
      // Blacklist the current token
      tokenBlacklist.blacklistToken(token, user.userId, 'logout')
    }

    res.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ'
    })
  }
})

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     tags: [Authentication]
 *     summary: ✅ Verify JWT Token
 *     description: |
 *       ## 🏊‍♂️ Swimlane Flow:
 *       1. **User** → Sends request with JWT token
 *       2. **System** → Validates token signature
 *       3. **System** → Checks token expiration
 *       4. **System** → Verifies user is active
 *       5. **User** → Receives user info if valid
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Verify token endpoint
authRoutes.get('/verify', authMiddleware, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user
  })
})

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: 📧 Request Password Reset
 *     description: |
 *       ## 🏊‍♂️ Swimlane Flow:
 *       1. **User** → Submits email address
 *       2. **System** → Validates email format
 *       3. **System** → Generates secure reset token
 *       4. **System** → Stores token in database
 *       5. **System** → Sends reset link via email
 *       
 *       **Rate Limit**: 3 attempts per 15 minutes per IP
 *       **Note**: Always returns success for security (doesn't reveal if email exists)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: Reset request processed (check email)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: หากอีเมลนี้มีอยู่ในระบบ จะได้รับลิงก์รีเซ็ตรหัสผ่านทางอีเมล
 *       400:
 *         description: Invalid email format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Request password reset
authRoutes.post('/forgot-password', passwordResetLimiter, async (req: Request, res: Response) => {
  try {
    const validation = PasswordResetRequestSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ข้อมูลไม่ถูกต้อง',
        details: validation.error.issues
      })
    }

    const { email } = validation.data

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        isActive: true
      }
    })

    // Always return success message for security (don't reveal if email exists)
    if (!user || !user.isActive) {
      return res.json({
        success: true,
        message: 'หากอีเมลนี้มีอยู่ในระบบ จะได้รับลิงก์รีเซ็ตรหัสผ่านทางอีเมล'
      })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save reset token to database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt
      }
    })

    // TODO: Send email with reset link (implement email service)
    console.log(`Password reset requested for ${email}`)
    console.log(`Reset token: ${resetToken}`)
    console.log(`Reset URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`)

    res.json({
      success: true,
      message: 'หากอีเมลนี้มีอยู่ในระบบ จะได้รับลิงก์รีเซ็ตรหัสผ่านทางอีเมล'
    })

  } catch (error) {
    console.error('Password reset request error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน'
    })
  }
})

// Reset password with token
authRoutes.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const validation = PasswordResetSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ข้อมูลไม่ถูกต้อง',
        details: validation.error.issues
      })
    }

    const { token, newPassword } = validation.data

    // Find valid reset token
    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            isActive: true
          }
        }
      }
    })

    if (!resetRequest || resetRequest.used || resetRequest.expiresAt < new Date() || !resetRequest.user.isActive) {
      return res.status(400).json({
        success: false,
        error: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว'
      })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRequest.userId },
        data: { passwordHash }
      }),
      prisma.passwordReset.update({
        where: { id: resetRequest.id },
        data: { used: true }
      })
    ])

    // Blacklist all existing tokens for this user (force re-login)
    tokenBlacklist.blacklistAllUserTokens(resetRequest.userId, 'password_change')

    res.json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน'
    })
  }
})

// Change password (authenticated users)
authRoutes.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = ChangePasswordSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ข้อมูลไม่ถูกต้อง',
        details: validation.error.issues
      })
    }

    const { currentPassword, newPassword } = validation.data
    const user = req.user!

    // Get user's current password hash
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        passwordHash: true,
        isActive: true
      }
    })

    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({
        success: false,
        error: 'ผู้ใช้ไม่พบหรือถูกระงับ'
      })
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, dbUser.passwordHash)
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
      })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: user.userId },
      data: { passwordHash }
    })

    // Blacklist all existing tokens for this user (force re-login)
    tokenBlacklist.blacklistAllUserTokens(user.userId, 'password_change')

    res.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่'
    })

  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน'
    })
  }
})

// Get blacklist stats (Admin only)
authRoutes.get('/blacklist/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = req.user!
    
    // Only admins can view blacklist stats
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
      })
    }

    const stats = tokenBlacklist.getStats()
    
    res.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Get blacklist stats error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ blacklist'
    })
  }
})