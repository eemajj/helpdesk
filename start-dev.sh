#!/bin/bash

echo "🔥 DWF Helpdesk Development Server Startup"
echo "========================================="

# Kill existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "tsx.*server-complete" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

sleep 2

# Start backend in background and wait for it to be ready
echo "🚀 Starting Backend Server..."
cd /Users/maryjaneluangkailerst/Desktop/DWFHelpdesk/backend
npx tsx src/server-complete.ts > /tmp/dwf-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready (check for port 3002)
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:3002/ > /dev/null 2>&1; then
        echo "✅ Backend ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start in 30 seconds"
        tail -20 /tmp/dwf-backend.log
        exit 1
    fi
done

# Start frontend
echo "🌐 Starting Frontend Server..."
cd /Users/maryjaneluangkailerst/Desktop/DWFHelpdesk/frontend
npm start > /tmp/dwf-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to start..."
for i in {1..60}; do
    if curl -s http://localhost:3000/ > /dev/null 2>&1; then
        echo "✅ Frontend ready!"
        break
    fi
    sleep 1
    if [ $i -eq 60 ]; then
        echo "❌ Frontend failed to start in 60 seconds"
        tail -20 /tmp/dwf-frontend.log
        exit 1
    fi
done

echo ""
echo "🎉 All servers are ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:3002" 
echo "📖 API Docs: http://localhost:3002/api-docs"
echo ""
echo "📋 Logs:"
echo "  Backend: tail -f /tmp/dwf-backend.log"
echo "  Frontend: tail -f /tmp/dwf-frontend.log"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    pkill -f "tsx.*server-complete" 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    rm -f /tmp/dwf-backend.log /tmp/dwf-frontend.log
    echo "✅ Cleanup complete"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait