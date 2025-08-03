import { Router } from 'express'
import { prisma } from '../db/connection'
import { authMiddleware, requireAdmin } from '../middleware/auth'

export const userRoutes = Router()

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

// ดูรายการผู้ใช้ทั้งหมด (เฉพาะ Admin)
userRoutes.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
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
            assignedTickets: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return res.json({
      success: true,
      users: users
    })

  } catch (error) {
    console.error('Get users error:', error)
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' })
  }
})

// สร้างผู้ใช้ใหม่ (เฉพาะ Admin)
userRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { username, password, fullName, email, role } = req.body

    // ตรวจสอบว่ามี username นี้แล้วหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีในระบบแล้ว' })
    }

    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        fullName,
        email,
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

    return res.json({
      success: true,
      message: 'สร้างผู้ใช้สำเร็จ',
      user: newUser
    })

  } catch (error) {
    console.error('Create user error:', error)
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้' })
  }
})

// อัปเดตสถานะผู้ใช้ (เฉพาะ Admin)
userRoutes.patch('/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const { isActive } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        username: true,
        fullName: true,
        isActive: true
      }
    })

    return res.json({
      success: true,
      message: 'อัปเดตสถานะผู้ใช้สำเร็จ',
      user: updatedUser
    })

  } catch (error) {
    console.error('Update user status error:', error)
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะผู้ใช้' })
  }
})