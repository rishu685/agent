#!/bin/bash

echo "Starting AgentX Project..."

# Install backend dependencies if not already installed
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Install frontend dependencies if not already installed
if [ ! -d "App/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd App
    npm install
    cd ..
fi

# Start Express.js backend in background
echo "Starting Express.js Backend Server..."
cd backend
nohup node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start React frontend
echo "Starting React Frontend..."
cd App
npm start &
FRONTEND_PID=$!

echo "AgentX is starting up..."
echo "Backend Server: http://localhost:5000 (PID: $BACKEND_PID)"
echo "Frontend App: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "To stop the servers:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Backend logs: tail -f ../backend.log"

# Keep script running
waitsh

echo "Starting AgentX Project..."

# Activate virtual environment
source venv/bin/activate

# Start Server1 in background
echo "Starting Server1 (Authentication & File Management)..."
python Server1.py &
SERVER1_PID=$!

# Start Server2 in background  
echo "Starting Server2 (AI & RAG Processing)..."
python Server2.py &
SERVER2_PID=$!

# Start React frontend
echo "Starting React Frontend..."
cd App
npm start &
FRONTEND_PID=$!

# Wait a moment for servers to start
sleep 3

echo ""
echo "🚀 AgentX is now running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Server1 (Auth): http://localhost:5000"
echo "🤖 Server2 (AI): http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup all processes
cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $SERVER1_PID $SERVER2_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for user to stop
wait
