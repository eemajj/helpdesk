#!/bin/bash
# DWF Helpdesk Ultra Performance Startup Script
# Created: August 6, 2025

echo "🚀 Starting DWF Helpdesk System (Ultra Performance Mode)"
echo "======================================================"

# Navigate to project directory
cd "$(dirname "$0")"

# Function to cleanup existing processes
cleanup() {
    echo "🧹 Cleaning up existing processes..."
    pkill -f "tsx.*server-complete" 2>/dev/null || true
    pkill -f "react-scripts" 2>/dev/null || true
    sleep 2
}

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend Server (Port 3002)..."
    cd backend
    nohup npx tsx src/server-complete.ts > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to be ready
    echo "⏳ Waiting for backend to start..."
    for i in {1..10}; do
        if curl -s http://localhost:3002/api/categories > /dev/null 2>&1; then
            echo "✅ Backend ready on http://localhost:3002"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "❌ Backend failed to start"
            exit 1
        fi
        sleep 1
    done
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend Server (Port 3000)..."
    cd frontend
    nohup npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to be ready
    echo "⏳ Waiting for frontend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Frontend ready on http://localhost:3000"
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ Frontend failed to start"
            exit 1
        fi
        sleep 1
    done
}

# Main execution
cleanup
start_backend
start_frontend

echo ""
echo "🎉 DWF Helpdesk System Started Successfully!"
echo "=============================================="
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3002/api"
echo ""
echo "👤 Login Credentials:"
echo "   - Admin:    admin/admin123"
echo "   - Support1: support1/support123"
echo "   - Support2: support2/support123"
echo ""
echo "📝 Log files:"
echo "   - Backend:  backend.log"
echo "   - Frontend: frontend.log"
echo ""
echo "⚡ Ultra Performance Features Enabled:"
echo "   ✅ Code Splitting & Lazy Loading"
echo "   ✅ Optimized Bundle (11 chunks)"
echo "   ✅ Smart WebSocket Reconnection"
echo "   ✅ Secure JWT Authentication"
echo "   ✅ Protected Routes & RBAC"
echo ""
echo "🔥 Press Ctrl+C to stop all services"

# Keep script running and handle cleanup on exit
trap cleanup EXIT

# Wait for processes
wait