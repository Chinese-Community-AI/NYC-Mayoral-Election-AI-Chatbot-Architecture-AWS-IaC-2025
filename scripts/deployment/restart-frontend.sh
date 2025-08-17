#!/bin/bash
set -euo pipefail

# Kill any existing frontend development server
pkill -f "node.*start" || true

# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start