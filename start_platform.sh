#!/usr/bin/env bash
# ==============================================================================
# Smart Campus Digital Twin & Facility Intelligence Platform
# Unified Start Script (Linux / macOS / WSL)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\033[1;36m==========================================================\033[0m"
echo -e "\033[1;33m  Starting Smart Campus Platform (Backend + Frontend)   \033[0m"
echo -e "\033[1;36m==========================================================\033[0m"

# 1. Start FastAPI Backend in background
echo -e "\033[0;32m[+] Launching FastAPI backend on http://localhost:8000...\033[0m"
(cd "$SCRIPT_DIR/backend" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &
BACKEND_PID=$!

# 2. Start Vite Frontend in background
echo -e "\033[0;32m[+] Launching Vite frontend on http://localhost:5173...\033[0m"
(cd "$SCRIPT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo -e "\n\033[1;32m[OK] Backend running at:  http://localhost:8000 (API Docs: http://localhost:8000/docs)\033[0m"
echo -e "\033[1;32m[OK] Frontend running at: http://localhost:5173\033[0m"
echo -e "\033[1;36m[i] Press CTRL+C to gracefully stop all services.\033[0m\n"

# Trap CTRL+C to cleanly terminate both child processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0" SIGINT SIGTERM

wait
