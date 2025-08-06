
import request from 'supertest';
import app from '../../server-complete'; // Import the Express app
import { prisma } from '../../db/connection';
import bcrypt from 'bcryptjs';

// Mock services that create open handles
jest.mock('../../services/tokenBlacklist', () => ({
  tokenBlacklist: {
    blacklistToken: jest.fn(),
    blacklistAllUserTokens: jest.fn(),
    cleanupExpiredTokens: jest.fn(),
    getStats: jest.fn(),
  },
}));

jest.mock('../../services/websocketService', () => ({
  websocketService: {
    initialize: jest.fn(),
    sendToUser: jest.fn(),
    broadcast: jest.fn(),
  },
}));

jest.mock('../../middleware/fileUpload', () => ({
  cleanupOldFiles: jest.fn(),
  upload: {
    single: () => (req: any, res: any, next: any) => next(),
    array: () => (req: any, res: any, next: any) => next(),
  },
}));

// Mock the prisma client
jest.mock('../../db/connection', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Auth Routes: POST /api/auth/login', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('should login successfully with correct credentials', async () => {
    const mockUser = {
      id: 1,
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
      fullName: 'Admin User',
      email: 'admin@dwf.go.th',
      isActive: true,
    };

    // Setup mock implementation
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue({}); // Mock the update call for lastLogin

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('เข้าสู่ระบบสำเร็จ');
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user.username).toBe('admin');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'admin' },
        select: {
            id: true,
            username: true,
            passwordHash: true,
            role: true,
            fullName: true,
            email: true,
            isActive: true
        }
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLogin: expect.any(Date) }
    });
  });

  test('should fail with 401 for incorrect password', async () => {
    const mockUser = {
      id: 1,
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', 10), // Correct hash
      role: 'admin',
      isActive: true,
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' }); // Incorrect password

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  });

  test('should fail with 401 for non-existent user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // User not found

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'password' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  });

  test('should fail with 401 for inactive user', async () => {
    const mockUser = {
      id: 2,
      username: 'inactive',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'user',
      isActive: false, // User is inactive
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'inactive', password: 'password123' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('บัญชีผู้ใช้ถูกระงับ');
  });

  test('should fail with 400 for invalid input (missing password)', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin' }); // Missing password

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('ข้อมูลไม่ถูกต้อง');
  });

  test('should fail with 400 for invalid input (empty username)', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: '', password: 'password' }); // Empty username

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('ข้อมูลไม่ถูกต้อง');
  });
});
