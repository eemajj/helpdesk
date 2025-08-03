#!/bin/bash

echo "🚀 DWF Helpdesk Setup Script"
echo "=============================="

# ตรวจสอบว่ามี Node.js หรือไม่
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ไม่ได้ติดตั้ง กรุณาติดตั้ง Node.js ก่อน"
    exit 1
fi

# ตรวจสอบว่ามี PostgreSQL หรือไม่
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL ไม่ได้ติดตั้ง กรุณาติดตั้ง PostgreSQL ก่อน"
    echo "   brew install postgresql (สำหรับ macOS)"
    exit 1
fi

echo "✅ Node.js และ PostgreSQL พร้อมใช้งาน"

# ติดตั้ง dependencies
echo ""
echo "📦 กำลังติดตั้ง Backend dependencies..."
cd backend
npm install

echo ""
echo "📦 กำลังติดตั้ง Frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "🗄️ กำลังสร้าง Database..."
cd ..

# สร้าง database (ถ้ายังไม่มี)
createdb dwf_helpdesk 2>/dev/null || echo "Database dwf_helpdesk มีอยู่แล้ว"

# รัน schema
echo "📋 กำลังสร้างตาราง..."
psql dwf_helpdesk < database/schema.sql

# สร้าง .env file ถ้ายังไม่มี
if [ ! -f backend/.env ]; then
    echo "⚙️ กำลังสร้างไฟล์ .env..."
    cp backend/.env.example backend/.env
    echo "📝 กรุณาแก้ไขไฟล์ backend/.env ให้ถูกต้อง"
else
    echo "✅ ไฟล์ .env มีอยู่แล้ว"
fi

echo ""
echo "🎉 Setup เสร็จสิ้น!"
echo ""
echo "📋 วิธีการรันระบบ:"
echo ""
echo "1. แก้ไขไฟล์ backend/.env ให้ถูกต้อง"
echo ""
echo "2. รัน Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "3. รัน Frontend (Terminal ใหม่):"
echo "   cd frontend && npm start"
echo ""
echo "4. เข้าใช้งาน:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🔧 หาก PostgreSQL ยังไม่ได้เริ่ม:"
echo "   brew services start postgresql"