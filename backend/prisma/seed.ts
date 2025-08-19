import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 0. Seed Users (Admin and Support staff)
  // Generate secure random passwords for development
  const adminPassword = process.env.ADMIN_PASSWORD || 'DWF_Admin_2024';
  const supportPassword = process.env.SUPPORT_PASSWORD || 'DWF_Support_2024';

  const users = [
    {
      username: 'admin',
      passwordHash: await bcrypt.hash(adminPassword, 12),
      fullName: 'ผู้ดูแลระบบหลัก',
      email: 'admin@dwf.go.th',
      role: 'admin' as const,
      isActive: true
    },
    {
      username: 'support1',
      passwordHash: await bcrypt.hash(supportPassword, 12),
      fullName: 'เจ้าหน้าที่ IT คนที่ 1',
      email: 'support1@dwf.go.th',
      role: 'support' as const,
      isActive: true
    },
    {
      username: 'support2', 
      passwordHash: await bcrypt.hash(supportPassword, 12),
      fullName: 'เจ้าหน้าที่ IT คนที่ 2',
      email: 'support2@dwf.go.th',
      role: 'support' as const,
      isActive: true
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      create: user
    });
  }
  console.log('Seeded users.');

  // 1. Seed Categories
  const categories = [
    { name: 'ฮาร์ดแวร์', description: 'ปัญหาเกี่ยวกับฮาร์ดแวร์คอมพิวเตอร์', sortOrder: 1 },
    { name: 'ซอฟต์แวร์', description: 'ปัญหาเกี่ยวกับซอฟต์แวร์และโปรแกรม', sortOrder: 2 },
    { name: 'เครือข่าย', description: 'ปัญหาเกี่ยวกับอินเทอร์เน็ตและเครือข่าย', sortOrder: 3 },
    { name: 'เครื่องพิมพ์', description: 'ปัญหาเกี่ยวกับเครื่องพิมพ์และอุปกรณ์พิมพ์', sortOrder: 4 },
    { name: 'โทรศัพท์', description: 'ปัญหาเกี่ยวกับระบบโทรศัพท์', sortOrder: 5 },
    { name: 'อีเมล', description: 'ปัญหาเกี่ยวกับระบบอีเมล', sortOrder: 6 },
    { name: 'ระบบงาน', description: 'ปัญหาเกี่ยวกับระบบงานต่างๆ', sortOrder: 7 },
    { name: 'ไวรัส', description: 'ปัญหาเกี่ยวกับไวรัสและมัลแวร์', sortOrder: 8 },
    { name: 'สำรองข้อมูล', description: 'ปัญหาเกี่ยวกับการสำรองข้อมูล', sortOrder: 9 },
    { name: 'การอบรม', description: 'ขอการอบรมและสนับสนุน', sortOrder: 10 },
    { name: 'อื่นๆ', description: 'ปัญหาอื่นๆ ที่ไม่อยู่ในหมวดหมู่ข้างต้น', sortOrder: 11 }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }
  console.log('Seeded categories.');

  // 2. Seed Priorities
  const priorities = [
    { name: 'วิกฤต', level: 8, description: 'ต้องแก้ไขทันที (1 ชั่วโมง)', slaHours: 1, color: '#dc2626' },
    { name: 'เร่งด่วนมาก', level: 7, description: 'แก้ไขภายใน 2 ชั่วโมง', slaHours: 2, color: '#ea580c' },
    { name: 'เร่งด่วน', level: 6, description: 'แก้ไขภายใน 4 ชั่วโมง', slaHours: 4, color: '#d97706' },
    { name: 'สูง', level: 5, description: 'แก้ไขภายใน 8 ชั่วโมง', slaHours: 8, color: '#ca8a04' },
    { name: 'ปกติ', level: 4, description: 'แก้ไขภายใน 1 วัน', slaHours: 24, color: '#16a34a' },
    { name: 'ต่ำ', level: 3, description: 'แก้ไขภายใน 2 วัน', slaHours: 48, color: '#0d9488' },
    { name: 'ต่ำมาก', level: 2, description: 'แก้ไขภายใน 3 วัน', slaHours: 72, color: '#0891b2' },
    { name: 'ต่ำสุด', level: 1, description: 'แก้ไขตามความเหมาะสม', slaHours: 168, color: '#6b7280' }
  ];

  for (const priority of priorities) {
    await prisma.priority.upsert({
      where: { name: priority.name },
      update: {},
      create: priority
    });
  }
  console.log('Seeded priorities.');

  // 3. Clear existing tickets to ensure a clean slate
  await prisma.ticket.deleteMany({});
  console.log('Deleted all existing tickets.');

  // 2. Create 5 new distinct tickets
  const ticketsData = [
    {
      ticketId: `TK${Date.now() + 1}`,
      problemType: 'Hardware',
      problemDescription: 'หน้าจอคอมพิวเตอร์ไม่แสดงผลใดๆ เลยหลังจากเปิดเครื่อง ไฟเข้าปกติ แต่หน้าจอมืดสนิท',
      fullName: 'สมชาย ใจดี',
      phoneNumber: '0812345678',
      department: 'บัญชี',
      division: '',
      status: 'รอดำเนินการ',
      priority: 'สูง',
      assetNumber: 'ASSET-001',
    },
    {
      ticketId: `TK${Date.now() + 2}`,
      problemType: 'Software',
      problemDescription: 'โปรแกรม Microsoft Excel ปิดตัวเองตลอดเวลาเมื่อพยายามเปิดไฟล์ที่มีขนาดใหญ่',
      fullName: 'สมหญิง จริงใจ',
      phoneNumber: '0823456789',
      department: 'การตลาด',
      division: '',
      status: 'กำลังดำเนินการ',
      priority: 'ปกติ',
    },
    {
      ticketId: `TK${Date.now() + 3}`,
      problemType: 'Network',
      problemDescription: 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ตั้งแต่เช้า ลองรีสตาร์ทเราเตอร์แล้วแต่ยังใช้ไม่ได้',
      fullName: 'วิชัย มีชัย',
      phoneNumber: '0834567890',
      department: 'บุคคล',
      division: '',
      status: 'รอดำเนินการ',
      priority: 'วิกฤต',
      assetNumber: 'ASSET-003',
    },
    {
      ticketId: `TK${Date.now() + 4}`,
      problemType: 'Other',
      otherProblemType: 'ขอติดตั้งเครื่องพิมพ์',
      problemDescription: 'ต้องการขอติดตั้งเครื่องพิมพ์สีตัวใหม่ที่แผนกจัดซื้อชั้น 3',
      fullName: 'มานี มีนา',
      phoneNumber: '0845678901',
      department: 'จัดซื้อ',
      division: '',
      status: 'เสร็จสิ้น',
      priority: 'ต่ำ',
    },
    {
      ticketId: `TK${Date.now() + 5}`,
      problemType: 'Software',
      problemDescription: 'ไม่สามารถล็อกอินเข้าระบบ ERP ได้ ระบบแจ้งว่ารหัสผ่านไม่ถูกต้อง ทั้งที่ใช้รหัสเดิมมาตลอด',
      fullName: 'ปิติ ยินดี',
      phoneNumber: '0856789012',
      department: 'คลังสินค้า',
      division: '',
      status: 'รอดำเนินการ',
      priority: 'สูง',
    },
  ];

  await prisma.ticket.createMany({
    data: ticketsData,
  });

  console.log(`Created 5 new tickets.`);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });