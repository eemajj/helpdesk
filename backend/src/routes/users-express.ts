import { Router, Request, Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../db/connection'
import { authMiddleware, requireAdmin, requireSupport } from '../middleware/auth'
import { tokenBlacklist } from '../services/tokenBlacklist'

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - fullName
 *         - role
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           description: ชื่อผู้ใช้
 *           example: support1
 *         password:
 *           type: string
 *           minLength: 6
 *           description: รหัสผ่าน
 *           example: support123
 *         fullName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: ชื่อ-นามสกุล
 *           example: นายสมชาย รักดี
 *         email:
 *           type: string
 *           format: email
 *           description: อีเมล (ไม่บังคับ)
 *           example: support1@dwf.go.th
 *         role:
 *           type: string
 *           enum: [admin, support, user]
 *           description: บทบาทของผู้ใช้
 *           example: support
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: ชื่อ-นามสกุล
 *           example: นายสมชาย รักดีที่สุด
 *         email:
 *           type: string
 *           format: email
 *           description: อีเมล
 *           example: support1_new@dwf.go.th
 *         role:
 *           type: string
 *           enum: [admin, support, user]
 *           description: บทบาทของผู้ใช้
 *           example: support
 *         isActive:
 *           type: boolean
 *           description: สถานะการใช้งาน
 *           example: true
 *     UserListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 */

const userRoutes = Router()

// Validation schemas
const CreateUserSchema = z.object({
  username: z.string().min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร').max(50, 'ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  fullName: z.string().min(1, 'กรุณาระบุชื่อ-นามสกุล').max(100, 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional(),
  role: z.enum(['admin', 'support', 'user'], { errorMap: () => ({ message: 'บทบาทไม่ถูกต้อง' }) })
})

const UpdateUserSchema = z.object({
  fullName: z.string().min(1, 'กรุณาระบุชื่อ-นามสกุล').max(100, 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร').optional(),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional(),
  role: z.enum(['admin', 'support', 'user'], { errorMap: () => ({ message: 'บทบาทไม่ถูกต้อง' }) }).optional(),
  isActive: z.boolean().optional()
})

const UpdateProfileSchema = z.object({
  fullName: z.string().min(1, 'กรุณาระบุชื่อ-นามสกุล').max(100, 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร').optional(),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional()
})

// ข้อมูลโปรไฟล์ของตัวเอง (ผู้ใช้ทุกคนเข้าถึงได้)
userRoutes.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user
    
    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    })

    if (!userProfile) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลผู้ใช้' })
    }

    return res.json({
      success: true,
      user: userProfile
    })

  } catch (error) {
    console.error('Get profile error:', error)
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์' })
  }
})

// ดูรายการผู้ใช้ทั้งหมด (Admin/Support)
userRoutes.get('/', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      search, 
      role, 
      status 
    } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10))
    const skip = (pageNum - 1) * limitNum

    // Build filter conditions
    const where: any = { AND: [] }

    if (search && typeof search === 'string') {
      const searchTerm = search.trim()
      where.AND.push({
        OR: [
          { username: { contains: searchTerm, mode: 'insensitive' } },
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      })
    }

    if (role && role !== 'all') {
      where.AND.push({ role: role as string })
    }

    if (status === 'active') {
      where.AND.push({ isActive: true })
    } else if (status === 'inactive') {
      where.AND.push({ isActive: false })
    }

    const finalWhere = where.AND.length === 0 ? {} : where

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: finalWhere,
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              assignedTickets: { where: { status: { not: 'เสร็จสิ้น' } } },
              notifications: { where: { isRead: false } }
            }
          }
        },
        orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limitNum
      }),
      prisma.user.count({ where: finalWhere })
    ])

    res.json({
      success: true,
      users,
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        limit: limitNum,
        count: total
      }
    })

  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ 
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' 
    })
  }
})

// สร้างผู้ใช้ใหม่ (เฉพาะ Admin)
userRoutes.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const validation = CreateUserSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ข้อมูลไม่ถูกต้อง',
        details: validation.error.issues
      })
    }

    const { username, password, fullName, email, role } = validation.data

    // ตรวจสอบว่ามี username หรือ email นี้แล้วหรือไม่
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : [])
        ]
      }
    })

    if (existingUser) {
      const field = existingUser.username === username ? 'ชื่อผู้ใช้' : 'อีเมล'
      return res.status(400).json({ 
        success: false,
        error: `${field}นี้มีในระบบแล้ว` 
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        fullName,
        email: email || null,
        role
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    console.log(`👤 New user created: ${username} (${role}) by ${req.user!.username}`)

    res.status(201).json({
      success: true,
      message: 'สร้างผู้ใช้สำเร็จ',
      user: newUser
    })

  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ 
      success: false,
      error: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้' 
    })
  }
})

// ดูข้อมูลผู้ใช้ตาม ID (Admin/Support)
userRoutes.get('/:id', authMiddleware, requireSupport, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            assignedTickets: true,
            notifications: { where: { isRead: false } },
            comments: true
          }
        },
        assignedTickets: {
          where: { status: { not: 'เสร็จสิ้น' } },
          select: {
            id: true,
            ticketId: true,
            problemType: true,
            status: true,
            priority: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบผู้ใช้'
      })
    }

    res.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Get user by ID error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
    })
  }
})

// อัปเดตข้อมูลผู้ใช้ (เฉพาะ Admin)
userRoutes.put('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    const validation = UpdateUserSchema.safeParse(req.body)
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ข้อมูลไม่ถูกต้อง',
        details: validation.error.issues
      })
    }

    const updateData = validation.data

    // ตรวจสอบ email ซ้ำ (ถ้ามีการอัปเดต)
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          NOT: { id: userId }
        }
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'อีเมลนี้มีในระบบแล้ว'
        })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    })

    // ถ้าเปลี่ยนสถานะเป็นไม่ active ให้ blacklist tokens
    if (updateData.isActive === false) {
      tokenBlacklist.blacklistAllUserTokens(userId, 'security')
      console.log(`🚫 User ${updatedUser.username} deactivated, tokens blacklisted`)
    }

    console.log(`👤 User updated: ${updatedUser.username} by ${req.user!.username}`)

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
      user: updatedUser
    })

  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้'
    })
  }
})

// อัปเดตโปรไฟล์ตัวเอง
userRoutes.put('/profile/update', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = UpdateProfileSchema.safeParse(req.body)
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'ข้อมูลไม่ถูกต้อง',
        details: validation.error.issues
      })
    }

    const user = req.user!
    const updateData = validation.data

    // ตรวจสอบ email ซ้ำ (ถ้ามีการอัปเดต)
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          NOT: { id: user.userId }
        }
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'อีเมลนี้มีในระบบแล้ว'
        })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      message: 'อัปเดตโปรไฟล์สำเร็จ',
      user: updatedUser
    })

  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์'
    })
  }
})

// รีเซ็ตรหัสผ่านผู้ใช้ (เฉพาะ Admin)
userRoutes.post('/:id/reset-password', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, isActive: true }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบผู้ใช้'
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }
    })

    // Blacklist all tokens for this user
    tokenBlacklist.blacklistAllUserTokens(userId, 'password_change')

    console.log(`🔐 Password reset for user: ${user.username} by ${req.user!.username}`)

    res.json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านสำเร็จ ผู้ใช้จำเป็นต้องเข้าสู่ระบบใหม่'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน'
    })
  }
})

// ลบผู้ใช้ (เฉพาะ Admin)
userRoutes.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    const currentUser = req.user!

    // ไม่ให้ลบตัวเอง
    if (userId === currentUser.userId) {
      return res.status(400).json({
        success: false,
        error: 'ไม่สามารถลบบัญชีของตัวเองได้'
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        username: true, 
        role: true,
        _count: {
          select: {
            assignedTickets: { where: { status: { not: 'เสร็จสิ้น' } } }
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบผู้ใช้'
      })
    }

    // ตรวจสอบว่ามี tickets ที่ยังไม่เสร็จ
    if (user._count.assignedTickets > 0) {
      return res.status(400).json({
        success: false,
        error: `ไม่สามารถลบผู้ใช้ได้ เนื่องจากมี ${user._count.assignedTickets} tickets ที่ยังไม่เสร็จสิ้น`
      })
    }

    // Soft delete: เปลี่ยนเป็น inactive แทนการลบ
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        username: `${user.username}_deleted_${Date.now()}`
      }
    })

    // Blacklist all tokens
    tokenBlacklist.blacklistAllUserTokens(userId, 'security')

    console.log(`🗑️ User soft deleted: ${user.username} by ${currentUser.username}`)

    res.json({
      success: true,
      message: 'ลบผู้ใช้สำเร็จ'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการลบผู้ใช้'
    })
  }
})

// สถิติผู้ใช้ (Admin only)
userRoutes.get('/stats/overview', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [totalUsers, activeUsers, inactiveUsers, adminCount, supportCount, userCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: 'admin', isActive: true } }),
      prisma.user.count({ where: { role: 'support', isActive: true } }),
      prisma.user.count({ where: { role: 'user', isActive: true } })
    ])

    // Top active users by ticket assignments
    const topUsers = await prisma.user.findMany({
      where: { 
        isActive: true, 
        role: { in: ['admin', 'support'] }
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        _count: {
          select: {
            assignedTickets: { where: { status: { not: 'เสร็จสิ้น' } } },
            comments: true
          }
        }
      },
      orderBy: {
        assignedTickets: {
          _count: 'desc'
        }
      },
      take: 5
    })

    // Recent user activity
    const recentActivity = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        username: true,
        fullName: true,
        lastLogin: true,
        role: true
      },
      orderBy: { lastLogin: 'desc' },
      take: 10
    })

    res.json({
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: {
          admin: adminCount,
          support: supportCount,
          user: userCount
        },
        topUsers,
        recentActivity
      }
    })

  } catch (error) {
    console.error('Get user stats error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการดึงสถิติผู้ใช้'
    })
  }
})

export { userRoutes };