import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  // Text files
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  // Archives (with caution)
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
}

// Maximum file sizes (in bytes)
const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024, // 10MB for images
  document: 50 * 1024 * 1024, // 50MB for documents
  archive: 100 * 1024 * 1024, // 100MB for archives
}

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// File type validation
const getFileCategory = (mimetype: string): 'image' | 'document' | 'archive' | 'unknown' => {
  if (mimetype.startsWith('image/')) return 'image'
  if (mimetype.includes('pdf') || mimetype.includes('word') || mimetype.includes('excel') || 
      mimetype.includes('powerpoint') || mimetype.includes('text')) return 'document'
  if (mimetype.includes('zip') || mimetype.includes('rar')) return 'archive'
  return 'unknown'
}

// Generate secure filename
const generateSecureFilename = (originalName: string, mimetype: string): string => {
  const fileExtension = ALLOWED_FILE_TYPES[mimetype as keyof typeof ALLOWED_FILE_TYPES]?.[0] || '.bin'
  const randomName = crypto.randomBytes(16).toString('hex')
  const timestamp = Date.now()
  return `${timestamp}_${randomName}${fileExtension}`
}

// Virus-like pattern detection (basic security check)
const detectSuspiciousPatterns = (buffer: Buffer): boolean => {
  const suspiciousPatterns = [
    // Common malware signatures (simplified)
    Buffer.from('4D5A'), // MZ header (Windows executables)
    Buffer.from('504B0304'), // ZIP file that might contain executables
    Buffer.from('7F454C46'), // ELF header (Linux executables)
    // Script patterns
    Buffer.from('<script>', 'utf8'),
    Buffer.from('javascript:', 'utf8'),
    Buffer.from('vbscript:', 'utf8'),
    Buffer.from('eval(', 'utf8'),
    // PHP patterns
    Buffer.from('<?php', 'utf8'),
    Buffer.from('<?=', 'utf8'),
  ]

  for (const pattern of suspiciousPatterns) {
    if (buffer.includes(pattern)) {
      return true
    }
  }
  return false
}

// File validation middleware
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    // Check MIME type
    if (!ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]) {
      console.log(`🚫 Rejected file: Invalid MIME type ${file.mimetype}`)
      return cb(new Error(`ไฟล์ประเภท ${file.mimetype} ไม่ได้รับอนุญาต`))
    }

    // Check file extension
    const fileExt = path.extname(file.originalname).toLowerCase()
    const allowedExtensions = ALLOWED_FILE_TYPES[file.mimetype as keyof typeof ALLOWED_FILE_TYPES]
    
    if (!allowedExtensions.includes(fileExt)) {
      console.log(`🚫 Rejected file: Extension ${fileExt} doesn't match MIME type ${file.mimetype}`)
      return cb(new Error(`นามสกุลไฟล์ ${fileExt} ไม่ตรงกับประเภทไฟล์`))
    }

    // Check filename for suspicious patterns
    if (/[<>:"|?*\x00-\x1f]/.test(file.originalname)) {
      console.log(`🚫 Rejected file: Suspicious filename ${file.originalname}`)
      return cb(new Error('ชื่อไฟล์มีอักขระที่ไม่อนุญาต'))
    }

    cb(null, true)
  } catch (error) {
    console.error('File filter error:', error)
    cb(new Error('เกิดข้อผิดพลาดในการตรวจสอบไฟล์'))
  }
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const secureFilename = generateSecureFilename(file.originalname, file.mimetype)
    cb(null, secureFilename)
  }
})

// Create multer instance
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(MAX_FILE_SIZE)), // Use largest size as global limit
    files: 5, // Maximum 5 files per request
    fields: 20, // Maximum 20 non-file fields
  },
})

// Advanced file validation middleware (runs after multer)
export const validateUploadedFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.files && !req.file) {
      return next()
    }

    const files = req.files as Express.Multer.File[] || (req.file ? [req.file] : [])

    for (const file of files) {
      try {
        // Check file size based on category
        const category = getFileCategory(file.mimetype)
        const maxSize = category !== 'unknown' ? MAX_FILE_SIZE[category] : MAX_FILE_SIZE.document

        if (file.size > maxSize) {
          // Remove uploaded file
          fs.unlinkSync(file.path)
          return res.status(400).json({
            success: false,
            error: `ไฟล์ ${file.originalname} มีขนาดใหญ่เกินไป (สูงสุด ${Math.round(maxSize / 1024 / 1024)}MB)`
          })
        }

        // Read file content for security scanning
        const fileBuffer = fs.readFileSync(file.path)

        // Check for suspicious patterns
        if (detectSuspiciousPatterns(fileBuffer)) {
          // Remove suspicious file
          fs.unlinkSync(file.path)
          console.log(`🚫 Detected suspicious patterns in file: ${file.originalname}`)
          return res.status(400).json({
            success: false,
            error: `ไฟล์ ${file.originalname} มีเนื้อหาที่อาจเป็นอันตราย`
          })
        }

        // Verify file header matches MIME type (magic number validation)
        const isValidFileHeader = await verifyFileHeader(fileBuffer, file.mimetype)
        if (!isValidFileHeader) {
          // Remove file with invalid header
          fs.unlinkSync(file.path)
          console.log(`🚫 Invalid file header for: ${file.originalname}`)
          return res.status(400).json({
            success: false,
            error: `ไฟล์ ${file.originalname} มีรูปแบบไม่ถูกต้อง`
          })
        }

        console.log(`✅ File validated: ${file.originalname} -> ${file.filename}`)

      } catch (fileError) {
        console.error(`Error validating file ${file.originalname}:`, fileError)
        
        // Clean up file if exists
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path)
        }
        
        return res.status(400).json({
          success: false,
          error: `เกิดข้อผิดพลาดในการตรวจสอบไฟล์ ${file.originalname}`
        })
      }
    }

    next()

  } catch (error) {
    console.error('File validation error:', error)
    res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการตรวจสอบไฟล์'
    })
  }
}

// Verify file header (magic numbers)
const verifyFileHeader = async (buffer: Buffer, mimetype: string): Promise<boolean> => {
  const magicNumbers: Record<string, Buffer[]> = {
    'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
    'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
    'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
    'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')],
    'application/pdf': [Buffer.from('%PDF')],
    'application/zip': [Buffer.from([0x50, 0x4B, 0x03, 0x04])],
    'text/plain': [Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from([0xFF, 0xFE]), Buffer.from([0xFE, 0xFF])], // UTF-8, UTF-16 BOMs or any text
  }

  const expectedMagics = magicNumbers[mimetype]
  if (!expectedMagics) {
    // If we don't have magic numbers defined, allow it (for documents like DOC, DOCX)
    return true
  }

  // For text files, be more lenient
  if (mimetype === 'text/plain') {
    return true // Text files are generally safe
  }

  // Check if buffer starts with any of the expected magic numbers
  for (const magic of expectedMagics) {
    if (buffer.subarray(0, magic.length).equals(magic)) {
      return true
    }
    
    // Special case for WEBP
    if (mimetype === 'image/webp' && 
        buffer.subarray(0, 4).equals(Buffer.from('RIFF')) && 
        buffer.subarray(8, 12).equals(Buffer.from('WEBP'))) {
      return true
    }
  }

  return false
}

// Clean up old files (run periodically)
export const cleanupOldFiles = () => {
  const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
  
  try {
    const files = fs.readdirSync(UPLOAD_DIR)
    let cleanedCount = 0
    
    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file)
      const stats = fs.statSync(filePath)
      
      if (Date.now() - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old uploaded files`)
    }
  } catch (error) {
    console.error('File cleanup error:', error)
  }
}

// Export constants for use in other modules
export const FILE_UPLOAD_CONFIG = {
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
}