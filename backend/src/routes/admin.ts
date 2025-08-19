
import express from 'express';
import { Prisma, PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware, requireAdmin } from '../middleware/auth';

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminStats:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           description: จำนวนผู้ใช้ทั้งหมด
 *           example: 25
 *         supportUsersWithAutoAssign:
 *           type: integer
 *           description: จำนวน support users ที่มี auto assign
 *           example: 5
 *         totalSupportUsers:
 *           type: integer
 *           description: จำนวน support users ทั้งหมด
 *           example: 5
 *         pendingRequests:
 *           type: integer
 *           description: จำนวนคำขอที่รอการอนุมัติ
 *           example: 0
 *         activeTickets:
 *           type: integer
 *           description: จำนวน tickets ที่ยังไม่เสร็จสิ้น
 *           example: 45
 *     AutoAssignResult:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: ระบบ Auto Assign ทำงานสำเร็จ
 *         assigned:
 *           type: integer
 *           description: จำนวน tickets ที่ถูกมอบหมาย
 *           example: 12
 */

const prisma = new PrismaClient();
const router = express.Router();

// Middleware to ensure only admins can access these routes
router.use(authMiddleware, requireAdmin);

// GET admin statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, supportUsers, activeTickets] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'support' } }),
      prisma.ticket.count({ where: { status: { not: 'เสร็จสิ้น' } } })
    ]);

    const stats = {
      totalUsers,
      supportUsersWithAutoAssign: supportUsers, // สมมติว่าทุก support user มี auto assign
      totalSupportUsers: supportUsers,
      pendingRequests: 0, // ยังไม่มีระบบ pending requests
      activeTickets
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics' });
  }
});

// GET all users for admin dashboard
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Exclude password hash from the response
    res.json(users.map(u => {
        const { passwordHash, ...userWithoutPassword } = u;
        return userWithoutPassword;
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// POST - Create a new user
router.post('/users', async (req, res) => {
  const { username, password, fullName, email, role } = req.body;

  if (!username || !password || !fullName || !email || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        fullName,
        email,
        role: role as UserRole,
        isActive: true,
      },
    });
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return res.status(409).json({ message: `User with that ${error.meta?.target} already exists.` });
    }
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// PUT - Update a user's details
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, email, role, isActive } = req.body;

  if (role && !Object.values(UserRole).includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: {
        fullName,
        email,
        role: role as UserRole,
        isActive,
      },
    });
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// DELETE (Soft) - Deactivate a user
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deactivatedUser = await prisma.user.update({
            where: { id: parseInt(id, 10) },
            data: { isActive: false },
        });
        const { passwordHash, ...userWithoutPassword } = deactivatedUser;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error(`Error deactivating user ${id}:`, error);
        res.status(500).json({ message: 'Failed to deactivate user' });
    }
});


export default router;
