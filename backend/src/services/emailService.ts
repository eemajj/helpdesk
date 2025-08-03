import nodemailer from 'nodemailer'
import { query } from '../db/connection'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

interface TicketData {
  ticket_id: string
  problem_type: string
  problem_description: string
  full_name: string
  status: string
  priority: string
  assigned_to_name?: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private isConfigured: boolean = false

  constructor() {
    this.initializeTransporter()
  }

  private async initializeTransporter() {
    try {
      // ตรวจสอบการตั้งค่าอีเมลจาก environment variables
      const emailConfig: EmailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASSWORD || ''
        }
      }

      // ถ้าไม่มีการตั้งค่าอีเมล ให้ใช้ ethereal email สำหรับทดสอบ
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        console.log('🔧 No SMTP config found, creating test account...')
        const testAccount = await nodemailer.createTestAccount()
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        })
        
        console.log('📧 Test email account created:')
        console.log('  User:', testAccount.user)
        console.log('  Pass:', testAccount.pass)
        console.log('  Preview URL: https://ethereal.email/')
      } else {
        this.transporter = nodemailer.createTransport(emailConfig)
      }

      // ทดสอบการเชื่อมต่อ
      await this.transporter!.verify()
      this.isConfigured = true
      console.log('✅ Email service initialized successfully')

    } catch (error) {
      console.error('❌ Email service initialization failed:', error)
      this.isConfigured = false
    }
  }

  private generateTicketEmailHTML(ticketData: TicketData, type: 'created' | 'assigned' | 'status_changed' | 'comment_added'): string {
    const baseStyles = `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #ec4899, #be185d); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .ticket-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .priority-high { color: #dc2626; }
        .priority-normal { color: #059669; }
        .priority-low { color: #6b7280; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background: #ec4899; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
      </style>
    `

    const headers = {
      created: 'มีการแจ้งปัญหาใหม่',
      assigned: 'ได้รับมอบหมาย Ticket ใหม่',
      status_changed: 'สถานะ Ticket มีการเปลี่ยนแปลง',
      comment_added: 'มีความคิดเห็นใหม่ใน Ticket'
    }

    const priorityClass = ticketData.priority === 'สูง' || ticketData.priority === 'วิกฤต' ? 'priority-high' : 
                          ticketData.priority === 'ปกติ' ? 'priority-normal' : 'priority-low'

    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DWF Helpdesk Notification</title>
        ${baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 DWF Helpdesk</h1>
            <p>${headers[type]}</p>
          </div>
          
          <div class="content">
            <h2>รายละเอียด Ticket</h2>
            
            <div class="ticket-info">
              <p><strong>รหัส Ticket:</strong> ${ticketData.ticket_id}</p>
              <p><strong>ประเภทปัญหา:</strong> ${ticketData.problem_type}</p>
              <p><strong>ผู้แจ้ง:</strong> ${ticketData.full_name}</p>
              <p><strong>สถานะ:</strong> <span class="status-badge">${ticketData.status}</span></p>
              <p><strong>ความสำคัญ:</strong> <span class="${priorityClass}">${ticketData.priority}</span></p>
              ${ticketData.assigned_to_name ? `<p><strong>ผู้รับผิดชอบ:</strong> ${ticketData.assigned_to_name}</p>` : ''}
            </div>
            
            <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #ec4899;">
              <strong>รายละเอียดปัญหา:</strong><br>
              ${ticketData.problem_description}
            </div>
            
            <a href="http://localhost:3000/dashboard" class="button">
              เข้าสู่ระบบ Dashboard
            </a>
          </div>
          
          <div class="footer">
            <p>ระบบ Helpdesk กรมกิจการสตรีและสถาบันครอบครัว</p>
            <p>อีเมลนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Email service not configured, skipping email send')
      return false
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"DWF Helpdesk" <${process.env.SMTP_FROM || 'noreply@dwf.go.th'}>`,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
      })

      console.log('✅ Email sent successfully:', info.messageId)
      
      // แสดง preview URL สำหรับ ethereal email
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info))
      }

      return true
    } catch (error) {
      console.error('❌ Failed to send email:', error)
      return false
    }
  }

  // ส่งอีเมลเมื่อมี ticket ใหม่
  async notifyNewTicket(ticketId: string): Promise<void> {
    try {
      // ดึงข้อมูล ticket และผู้ดูแลระบบ
      const ticketResult = await query(`
        SELECT t.*, u.full_name as assigned_to_name
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.ticket_id = $1
      `, [ticketId])

      const adminResult = await query(`
        SELECT email, full_name 
        FROM users 
        WHERE role = 'admin' AND is_active = true AND email IS NOT NULL
      `)

      if (ticketResult.rows.length === 0) return

      const ticket = ticketResult.rows[0]
      const subject = `[DWF Helpdesk] มี Ticket ใหม่: ${ticket.ticket_id}`
      const html = this.generateTicketEmailHTML(ticket, 'created')

      // ส่งอีเมลให้ admin ทุกคน
      for (const admin of adminResult.rows) {
        await this.sendEmail({
          to: admin.email,
          subject,
          html,
          text: `มี Ticket ใหม่: ${ticket.ticket_id} - ${ticket.problem_type}`
        })
      }

    } catch (error) {
      console.error('Error sending new ticket notification:', error)
    }
  }

  // ส่งอีเมลเมื่อ assign ticket
  async notifyTicketAssigned(ticketId: string, assignedUserId: number): Promise<void> {
    try {
      const ticketResult = await query(`
        SELECT t.*, u.full_name as assigned_to_name
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.id = $1
      `, [ticketId])

      const userResult = await query(`
        SELECT email, full_name 
        FROM users 
        WHERE id = $1 AND email IS NOT NULL
      `, [assignedUserId])

      if (ticketResult.rows.length === 0 || userResult.rows.length === 0) return

      const ticket = ticketResult.rows[0]
      const user = userResult.rows[0]
      const subject = `[DWF Helpdesk] ได้รับมอบหมาย Ticket: ${ticket.ticket_id}`
      const html = this.generateTicketEmailHTML(ticket, 'assigned')

      await this.sendEmail({
        to: user.email,
        subject,
        html,
        text: `คุณได้รับมอบหมาย Ticket: ${ticket.ticket_id} - ${ticket.problem_type}`
      })

    } catch (error) {
      console.error('Error sending ticket assigned notification:', error)
    }
  }

  // ส่งอีเมลเมื่อเปลี่ยนสถานะ
  async notifyStatusChanged(ticketId: string, oldStatus: string, newStatus: string): Promise<void> {
    try {
      const ticketResult = await query(`
        SELECT t.*, u.full_name as assigned_to_name, u.email as assigned_email
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.ticket_id = $1
      `, [ticketId])

      if (ticketResult.rows.length === 0) return

      const ticket = ticketResult.rows[0]
      const subject = `[DWF Helpdesk] สถานะ Ticket เปลี่ยนแปลง: ${ticket.ticket_id}`
      const html = this.generateTicketEmailHTML(ticket, 'status_changed')

      // ส่งอีเมลให้ผู้ที่ได้รับมอบหมาย
      if (ticket.assigned_email) {
        await this.sendEmail({
          to: ticket.assigned_email,
          subject,
          html,
          text: `สถานะ Ticket ${ticket.ticket_id} เปลี่ยนจาก "${oldStatus}" เป็น "${newStatus}"`
        })
      }

      // ถ้าเป็นสถานะเสร็จสิ้น ส่งให้ admin ด้วย
      if (newStatus === 'เสร็จสิ้น') {
        const adminResult = await query(`
          SELECT email FROM users WHERE role = 'admin' AND is_active = true AND email IS NOT NULL
        `)

        for (const admin of adminResult.rows) {
          await this.sendEmail({
            to: admin.email,
            subject: `[DWF Helpdesk] Ticket เสร็จสิ้น: ${ticket.ticket_id}`,
            html,
            text: `Ticket ${ticket.ticket_id} เสร็จสิ้นแล้ว`
          })
        }
      }

    } catch (error) {
      console.error('Error sending status change notification:', error)
    }
  }

  // ส่งอีเมลเมื่อมีความคิดเห็นใหม่
  async notifyNewComment(ticketId: string, commentUserId: number, comment: string): Promise<void> {
    try {
      const ticketResult = await query(`
        SELECT t.*, u.full_name as assigned_to_name, u.email as assigned_email
        FROM tickets t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.id = $1
      `, [ticketId])

      const commentUserResult = await query(`
        SELECT full_name FROM users WHERE id = $1
      `, [commentUserId])

      if (ticketResult.rows.length === 0 || commentUserResult.rows.length === 0) return

      const ticket = ticketResult.rows[0]
      const commentUser = commentUserResult.rows[0]
      const subject = `[DWF Helpdesk] ความคิดเห็นใหม่ใน Ticket: ${ticket.ticket_id}`
      
      let html = this.generateTicketEmailHTML(ticket, 'comment_added')
      html = html.replace('</div>\n            \n            <a href=', `
        </div>
        
        <div style="background: #e0f2fe; padding: 15px; border-radius: 6px; border-left: 4px solid #0284c7; margin: 20px 0;">
          <strong>ความคิดเห็นจาก ${commentUser.full_name}:</strong><br>
          ${comment}
        </div>
        
        <a href=`)

      // ส่งอีเมลให้ผู้ที่เกี่ยวข้อง (ยกเว้นคนที่เขียนความคิดเห็น)
      if (ticket.assigned_email && ticket.assigned_to !== commentUserId) {
        await this.sendEmail({
          to: ticket.assigned_email,
          subject,
          html,
          text: `${commentUser.full_name} เพิ่มความคิดเห็นใน Ticket ${ticket.ticket_id}: ${comment}`
        })
      }

    } catch (error) {
      console.error('Error sending comment notification:', error)
    }
  }
}

export const emailService = new EmailService()