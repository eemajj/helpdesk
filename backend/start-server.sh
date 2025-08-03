#!/bin/bash

# Kill existing processes
pkill -f "bun.*server-complete" 2>/dev/null
pkill -f "node.*3002\|node.*8080\|node.*3001" 2>/dev/null

# Wait for ports to be free
sleep 2

# Find available port
PORT=3002
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

echo "🔍 Using available port: $PORT"

# Update .env file
sed -i '' "s/^PORT=.*/PORT=$PORT/" .env

# Update frontend .env
sed -i '' "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=http://localhost:$PORT/api|" ../frontend/.env

echo "📝 Updated .env files"
echo "🚀 Starting server on port $PORT..."

# Start server
~/.bun/bin/bun run src/server-complete.ts