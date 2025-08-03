import { z } from 'zod'

export const ProblemType = z.enum([
  'คอมพิวเตอร์',
  'อินเทอร์เน็ต',
  'ปริ้นเตอร์',
  'ระบบสารสนเทศ',
  'ติดตั้ง',
  'อื่น ๆ'
])

export const Department = z.enum([
  'สลก.',
  'กยผ.',
  'กสค.',
  'กสพ.',
  'กคอ.',
  'ศจท.',
  'กพร.',
  'ตสน.'
])

export const CreateTicketSchema = z.object({
  problemType: ProblemType,
  otherProblemType: z.string().optional(),
  problemDescription: z.string().min(10, 'รายละเอียดปัญหาต้องมีอย่างน้อย 10 ตัวอักษร'),
  fullName: z.string().min(2, 'ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร'),
  phoneNumber: z.string().regex(/^[0-9]{9,10}$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก'),
  department: Department,
  division: z.string().min(1, 'กรุณาระบุกลุ่ม/ฝ่าย'),
  assetNumber: z.string().min(1, 'กรุณาระบุหมายเลขครุภัณฑ์')
})

export const TicketStatusSchema = z.enum([
  'รอดำเนินการ',
  'กำลังดำเนินการ',
  'รอข้อมูลเพิ่มเติม',
  'เสร็จสิ้น',
  'ยกเลิก'
])

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>
export type TicketStatus = z.infer<typeof TicketStatusSchema>