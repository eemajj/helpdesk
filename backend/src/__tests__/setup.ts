import { prisma } from '../db/connection'

// Setup และ cleanup สำหรับ tests
beforeAll(async () => {
  // เชื่อมต่อฐานข้อมูล
})

afterAll(async () => {
  // ปิดการเชื่อมต่อฐานข้อมูล
  await prisma.$disconnect()
})

beforeEach(async () => {
  // ล้างข้อมูลก่อนแต่ละ test (ถ้าจำเป็น)
})

afterEach(async () => {
  // ทำความสะอาดหลังแต่ละ test (ถ้าจำเป็น)
})