import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

// Swagger configuration options
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DWF Helpdesk API Documentation',
      version: '1.0.0',
      description: `
# DWF Helpdesk System API

ระบบ Helpdesk สำหรับกรมกิจการสตรีและสถาบันครอบครัว (DWF)

## 🎯 Overview
This API provides endpoints for managing support tickets, user authentication, and administrative functions for the DWF Helpdesk System.

## 🔐 Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`Authorization: Bearer <your_access_token>\`

## 📊 Response Format
All API responses follow this standard format:
\`\`\`json
{
  "success": boolean,
  "message": "string (optional)",
  "data": "object/array (optional)",
  "error": "string (optional, when success is false)"
}
\`\`\`

## 🏊‍♂️ API Flow Swimlanes

### Ticket Creation Flow
1. **User** → Submit ticket via public endpoint
2. **System** → Auto-assign to available support staff
3. **System** → Create notifications for admins
4. **WebSocket** → Send real-time notification
5. **Support** → Receive notification and start working

### Authentication Flow
1. **User** → Login with credentials
2. **System** → Validate and generate JWT tokens
3. **User** → Access protected endpoints with token
4. **System** → Validate token on each request
5. **User** → Refresh token when needed

### Ticket Management Flow
1. **Support** → View assigned tickets
2. **Support** → Update ticket status/comments
3. **System** → Log status changes
4. **System** → Send notifications to stakeholders
5. **Admin** → Monitor and reassign if needed
      `,
      contact: {
        name: 'DWF IT Support',
        email: 'support@dwf.go.th'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development Server (Local)'
      },
      {
        url: 'http://localhost:3002/api', 
        description: 'Development Server (Docker)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'admin' },
            fullName: { type: 'string', example: 'ผู้ดูแลระบบ' },
            email: { type: 'string', format: 'email', example: 'admin@dwf.go.th' },
            role: { type: 'string', enum: ['admin', 'support', 'user'], example: 'admin' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time' }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            ticketId: { type: 'string', example: 'TK1699234567890' },
            problemType: { type: 'string', example: 'ฮาร์ดแวร์' },
            problemDescription: { type: 'string', example: 'คอมพิวเตอร์เปิดไม่ติด' },
            fullName: { type: 'string', example: 'นายสมชาย ใจดี' },
            phoneNumber: { type: 'string', example: '0812345678' },
            department: { type: 'string', example: 'กลุ่มงานเทคโนโลยี' },
            division: { type: 'string', example: 'ฝ่ายพัฒนาระบบ' },
            assetNumber: { type: 'string', example: 'DWF-PC-001' },
            status: { type: 'string', example: 'รอดำเนินการ' },
            priority: { type: 'string', example: 'ปกติ' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            assignedTo: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                fullName: { type: 'string' }
              }
            }
          }
        },
        TicketComment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            comment: { type: 'string', example: 'กำลังตรวจสอบปัญหา' },
            commentType: { type: 'string', enum: ['general', 'status_change', 'internal'], example: 'general' },
            isInternal: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                fullName: { type: 'string' }
              }
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'ฮาร์ดแวร์' },
            description: { type: 'string', example: 'ปัญหาเกี่ยวกับฮาร์ดแวร์คอมพิวเตอร์' }
          }
        },
        Priority: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'วิกฤต' },
            level: { type: 'integer', example: 8 },
            description: { type: 'string', example: 'ต้องแก้ไขทันที (1 ชั่วโมง)' },
            sla: { type: 'integer', example: 1 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
            details: { 
              type: 'array',
              items: { type: 'object' }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            current: { type: 'integer', example: 1 },
            total: { type: 'integer', example: 5 },
            limit: { type: 'integer', example: 20 },
            count: { type: 'integer', example: 85 }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: '🔐 User authentication and authorization endpoints'
      },
      {
        name: 'Tickets',
        description: '🎫 Ticket management and tracking endpoints'
      },
      {
        name: 'Users',
        description: '👥 User management endpoints'
      },
      {
        name: 'System',
        description: '⚙️ System health and configuration endpoints'
      },
      {
        name: 'Dashboard',
        description: '📊 Dashboard statistics and analytics endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/server-complete.ts'
  ]
}

// Generate swagger specification
export const swaggerSpec = swaggerJSDoc(options)

// Swagger UI options
export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      req.headers['Content-Type'] = 'application/json'
      return req
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .info .title { color: #ec4899 }
    .swagger-ui .scheme-container { background: #fdf2f8; padding: 15px; border-radius: 5px; margin: 20px 0 }
  `,
  customSiteTitle: 'DWF Helpdesk API Documentation'
}

export { swaggerUi }