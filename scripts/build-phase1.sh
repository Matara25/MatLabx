#!/bin/bash

echo "🚀 Building Phase 1: Real CLI First"
echo "=================================="

# Step 1: Build FRRouting Docker image
echo "📦 Building FRRouting Docker image..."
cd docker/router
docker build -t matlabx-router:latest .
if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
else
    echo "❌ Docker image build failed"
    exit 1
fi

# Step 2: Install React Flow (if not already installed)
echo "📦 Installing React Flow..."
cd ../../frontend
if ! npm list reactflow &>/dev/null; then
    npm install reactflow
    if [ $? -eq 0 ]; then
        echo "✅ React Flow installed"
    else
        echo "❌ React Flow installation failed"
        exit 1
    fi
else
    echo "✅ React Flow already installed"
fi

# Step 3: Check if backend is running
echo "🔍 Checking backend status..."
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start it with: npm start"
    exit 1
fi

# Step 4: Check if frontend is running
echo "🔍 Checking frontend status..."
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not running. Please start it with: npm run dev"
    exit 1
fi

echo ""
echo "🎉 Phase 1 Build Complete!"
echo "=========================="
echo ""
echo "📋 What's Ready:"
echo "  ✅ FRRouting Docker container"
echo "  ✅ Terminal interface (xterm.js)"
echo "  ✅ Command execution flow"
echo "  ✅ Backend API endpoints"
echo "  ✅ Test page at /terminal-test"
echo ""
echo "🧪 How to Test:"
echo "  1. Open: http://localhost:3001/terminal-test"
echo "  2. Click 'Test Connection'"
echo "  3. Try commands like:"
echo "     - ls"
echo "     - ip addr"
echo "     - ping 8.8.8.8"
echo "     - vtysh -c 'show ip route'"
echo ""
echo "🎯 Next Steps:"
echo "  - Phase 2: Static Topology UI"
echo "  - Phase 3: Draggable Topology"
echo "  - Phase 4: Interactive Connections"
echo "  - Phase 5: Intelligent Labs"
echo ""
echo "🔗 Useful Commands:"
echo "  - View containers: docker ps"
echo "  - View logs: docker logs <container-id>"
echo "  - Cleanup: curl -X POST http://localhost:5001/api/simulation/cleanup"
