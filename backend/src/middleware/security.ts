/**
 * 🔒 Advanced Security Middleware
 * DWF Helpdesk Security Hardening
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { z } from 'zod';

// 🔒 Security Headers Configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false, // For development
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// 🚦 Advanced Rate Limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

// 🔐 Authentication Rate Limiting (Stricter)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// 🎯 CORS Configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://dwf-helpdesk.go.th', // Production domain
      'https://helpdesk.dwf.go.th'  // Alternative domain
    ];
    
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://127.0.0.1:3000', 'http://127.0.0.1:3001');
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control'
  ]
};

// 🛡️ Input Sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/[<>]/g, '') // Remove potential XSS tags
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// 🔍 Request Validation Schema
const requestValidationSchema = z.object({
  body: z.any().optional(),
  query: z.record(z.string()).optional(),
  params: z.record(z.string()).optional()
});

// 🚨 Security Event Logger
export class SecurityLogger {
  private static logs: any[] = [];

  static logSecurityEvent(event: {
    type: 'AUTH_FAILURE' | 'RATE_LIMIT' | 'INVALID_TOKEN' | 'SUSPICIOUS_REQUEST';
    ip: string;
    userAgent?: string;
    details?: any;
  }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event
    };
    
    this.logs.push(logEntry);
    
    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Security Event:', logEntry);
      // TODO: Send to external security monitoring
    } else {
      console.warn('🚨 Security Event (Dev):', logEntry);
    }
    
    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  static getLogs(): any[] {
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }
}

// 🔐 JWT Token Validation Enhancement
export const validateJWTSecurity = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    SecurityLogger.logSecurityEvent({
      type: 'INVALID_TOKEN',
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'],
      details: 'No token provided'
    });
    return res.status(401).json({ error: 'Access token required' });
  }

  // Additional token format validation
  const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  if (!jwtPattern.test(token)) {
    SecurityLogger.logSecurityEvent({
      type: 'INVALID_TOKEN',
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'],
      details: 'Invalid token format'
    });
    return res.status(401).json({ error: 'Invalid token format' });
  }

  next();
};

// 🛡️ SQL Injection Protection (Additional layer)
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    /(script|javascript|vbscript)/i,
    /['"]/g
  ];

  const checkSQLInjection = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    
    if (Array.isArray(value)) {
      return value.some(checkSQLInjection);
    }
    
    if (value && typeof value === 'object') {
      return Object.values(value).some(checkSQLInjection);
    }
    
    return false;
  };

  // Check request body and query parameters
  const suspicious = 
    checkSQLInjection(req.body) || 
    checkSQLInjection(req.query) || 
    checkSQLInjection(req.params);

  if (suspicious) {
    SecurityLogger.logSecurityEvent({
      type: 'SUSPICIOUS_REQUEST',
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'],
      details: 'Potential SQL injection attempt'
    });
    
    return res.status(400).json({ 
      error: 'Invalid request parameters' 
    });
  }

  next();
};

// 🔒 File Upload Security
export const fileUploadSecurity = {
  // Allowed file types
  allowedTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // Max file size (5MB)
  maxSize: 5 * 1024 * 1024,
  
  // Scan file for malicious content
  scanFile: (buffer: Buffer): boolean => {
    // Basic malicious pattern detection
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /%3cscript/i
    ];
    
    const content = buffer.toString('utf8');
    return !maliciousPatterns.some(pattern => pattern.test(content));
  }
};

// 🛡️ Production Security Checks
export const productionSecurityCheck = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    // Ensure HTTPS in production
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
    
    // Check for required security headers
    const requiredHeaders = ['user-agent', 'accept'];
    const missingHeaders = requiredHeaders.filter(header => !req.headers[header]);
    
    if (missingHeaders.length > 0) {
      SecurityLogger.logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        ip: req.ip || 'unknown',
        details: `Missing headers: ${missingHeaders.join(', ')}`
      });
    }
  }
  
  next();
};

export default {
  securityHeaders,
  apiRateLimit,
  authRateLimit,
  corsOptions,
  sanitizeInput,
  SecurityLogger,
  validateJWTSecurity,
  sqlInjectionProtection,
  fileUploadSecurity,
  productionSecurityCheck
};