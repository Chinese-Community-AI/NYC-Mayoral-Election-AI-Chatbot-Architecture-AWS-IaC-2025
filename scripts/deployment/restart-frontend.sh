#!/bin/bash
set -euo pipefail
pkill -f "node.*start" || true
cd frontend
npm install
npm start


