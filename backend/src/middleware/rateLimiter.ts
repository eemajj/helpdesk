import rateLimit from 'express-rate-limit';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    error_th: 'มีการร้องขอมากเกินไปจาก IP นี้ กรุณาลองใหม่อีกครั้งในภายหลัง'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.',
    error_th: 'มีการพยายาม login มากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
});

// Ticket creation rate limiter
export const ticketLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 ticket creations per hour
  message: {
    success: false,
    error: 'Too many tickets created from this IP, please try again later.',
    error_th: 'มีการสร้าง ticket มากเกินไปจาก IP นี้ กรุณาลองใหม่อีกครั้งในภายหลัง'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour  
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: {
    success: false,
    error: 'Too many password reset attempts, please try again later.',
    error_th: 'มีการขอรีเซ็ตรหัสผ่านมากเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง'
  },
  standardHeaders: true,
  legacyHeaders: false,
});