import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// กำหนดการเก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/tickets/');
  },
  filename: (req, file, cb) => {
    // สร้างชื่อไฟล์ใหม่ด้วย UUID + extension เดิม
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// กรองประเภทไฟล์ที่อนุญาต
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // อนุญาตเฉพาะรูปภาพ
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf' // เผื่อมี PDF เอกสาร
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ: JPG, PNG, GIF, WebP, PDF'), false);
  }
};

// สร้าง multer instance
export const uploadTicketFiles = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // จำกัดขนาด 5MB
    files: 3 // อนุญาตสูงสุด 3 ไฟล์ต่อครั้ง
  }
});

// Interface สำหรับไฟล์ที่อัพโหลด
export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}