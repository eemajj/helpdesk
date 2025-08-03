import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clear existing tickets to ensure a clean slate
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