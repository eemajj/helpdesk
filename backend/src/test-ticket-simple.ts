import 'dotenv/config'
import { prisma } from './db/connection'

async function testTicketCreation() {
  try {
    console.log('🔍 Testing Prisma Ticket Creation...')
    
    // ทดสอบการสร้าง ticket แบบง่าย
    const ticket = await prisma.ticket.create({
      data: {
        ticketId: `TEST${Date.now()}`,
        problemType: 'Hardware',
        problemDescription: 'Test ticket creation',
        fullName: 'นายทดสอบ ระบบ',
        phoneNumber: '0812345678',
        department: 'IT',
        division: 'ฝ่ายพัฒนาระบบ',
        status: 'รอดำเนินการ'
      }
    })
    
    console.log('✅ Ticket created successfully:', ticket)
    
  } catch (error) {
    console.error('❌ Error creating ticket:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testTicketCreation()