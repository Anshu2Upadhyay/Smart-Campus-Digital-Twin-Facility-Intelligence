# Smart Campus Digital Twin & Facility Intelligence

![MIT License](https://img.shields.io/badge/license-MIT-green.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss)
![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python)
![MongoDB](https://img.shields.io/badge/MongoDB-4.6-47A248?logo=mongodb)
![WebSockets](https://img.shields.io/badge/WebSockets-Realtime-010101)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Real--Time--Vision-000000)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-RAG-8E75B8?logo=google-ai)
![Build Status: passing](https://img.shields.io/badge/build-passing-brightgreen)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

> **AI Command Center • Proximity Security Dispatch • 6-Department Facility Intelligence**  
> Real-time NOC dashboard for smart campus operations, digital twin visualization, and data-driven facility management.

## Executive Summary

Smart Campus Digital Twin & Facility Intelligence is a real-time campus operations platform that unifies live CCTV/RTSP monitoring, IoT telemetry, GPS guard dispatch, and facility energy tracking into a 2D spatial digital twin. Built on a Python FastAPI backend with MongoDB, WebSocket event streaming, and an autonomous multimodal AI sentinel (YOLOv8 + Google Gemini), it powers six role-based dashboards — Super Admin, Security Head, Security Guard, Facility Supervisor, Ground Worker, and Student/Faculty — with SLA-driven auto-pilot escalation and an AI knowledge assistant (CampusGPT RAG).

## System Architecture

```text
┌─────────────────────┐       WebSocket / JSON Telemetry       ┌─────────────────────────────────┐
│   IoT Sensors       │═══════════════════════════════════════▶│        FastAPI Backend            │
│   CCTV / RTSP       │                                         │      http://localhost:8000      │
│   GPS Guards        │◀═══════════════════════════════════════│  • REST API (9 role routers)      │
│   Power Meters      │      Commands, Alerts, Dispatch         │  • WebSocket Gateway /ws/{role}   │
└─────────────────────┘                                         │  • MongoDB (Motor) + 2dsphere   │
                                                                │  • JWT Auth + bcrypt              │
                                                                │  • YOLOv8 + Gemini AI Sentinel    │
                                                                │  • CampusGPT RAG + SLA Monitor    │
                                                                └───────────────┬─────────────────┘
                                                                                │ HTTP / JSON
                                  ┌───────────────────────────────────────────▼──────────────────────────┐
                                  │                      React + Vite Frontend                           │
                                  │                    http://localhost:5173                             │
                                  │  • Leaflet Campus Maps                                             │
                                  │  • 2D SVG Spatial Digital Twin                                     │
                                  │  • CCTV Engine (RTSP / HLS live streams)                           │
                                  │  • 6 Role-Based Dashboards (Tailwind UI, dark NOC theme)           │
                                  └──────────────────────────────────────────────────────────────────────┘
```

**Data flow:** Sensors / CCTV / GPS → WebSocket & REST ingestion → FastAPI services (SLA monitor, AI Sentinel, CampusGPT RAG) → MongoDB → React dashboard over WebSocket with sub-second alert dispatch.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Python 3.11+, FastAPI, Uvicorn | API server, WebSocket gateway, lifespan services |
| **Database** | MongoDB (Motor / PyMongo) | Document store, 2dsphere geospatial indexes |
| **Auth** | python-jose, passlib/bcrypt, JWT | Role-based access control for 6 user roles |
| **AI / Vision** | YOLOv8 (ultralytics), OpenCV, Google Gemini, ChromaDB | Threat detection, multimodal video analysis, RAG |
| **Frontend** | React 18, Vite, Tailwind CSS | Single-page dashboard (JavaScript/JSX) |
| **Maps** | Leaflet, React-Leaflet | Satellite campus map & GPS guard radar |
| **Digital Twin** | Custom 2D SVG engine | Block / floor / room spatial blueprints |
| **Real-time** | WebSockets (`ws://:8000`) | Live GPS heartbeats, alerts, dispatch |
| **PWA** | vite-plugin-pwa | Installable, offline-capable client |
## Key Feature Highlights

- **2D Spatial Digital Twin** — Architectural SVG blueprint engine (Block-B, multi-floor plans, rooms with seating capacity, kW power telemetry, per-room CCTV assignments, stairs/elevator/washroom special renders).
- **CCTV Monitoring Engine** — RTSP/HLS stream presets, live camera roster, connect/disconnect controls, AI-analyzed thumbnails (fight, smoke, overcrowding detection).
- **GPS Radar & Live Guard Dispatch** — WebSocket 5-second GPS heartbeats, live guard locations, zone/status filtering, 1-click re-route waypoint orders, and "simulate walk towards incident" for demo/testing.
- **Autonomous AI Sentinel** — YOLOv8 + Gemini multimodal vision on a 15-second tick; detects violence, smoke, and overcrowding; raises real-time alerts to Security.
- **CampusGPT RAG** — Vector knowledge base over official campus circulars; natural-language Q&A for students and staff.
- **SLA Auto-Pilot & Escalation** — 3-tier SLA monitoring (10-second tick): supervisor auto-pilot, worker task-accept deadlines, escalation timers, and ghost-energy detection for vacant rooms (>10 min).
- **6 Role-Based Portals** — Super Admin, Security Head, Security Guard, Facility Supervisor, Ground Worker, Student/Faculty — each with dedicated layouts and permissions.
- **Facility Intelligence** — Per-room energy monitoring (kW, ₹/kWh tariff), workorder lifecycle, attendance ledger, incidents/SOS, and complaints with proof uploads.
- **PWA-Ready** — Vite PWA plugin, mobile-responsive dark-themed NOC UI, installable client.

## Project Directory Tree

```text
Smart-Campus-Digital-Twin-Facility-Intelligence/
├── backend/                              # FastAPI API, WebSocket gateway & AI services
│   ├── app/
│   │   ├── main.py                       # FastAPI app, lifespan, REST + WebSocket routes
│   │   ├── config.py                     # Pydantic settings (loads .env)
│   │   ├── database.py                   # Motor MongoDB client & index init
│   │   ├── seed.py                       # Seed: 6 roles, users, blocks, rooms, alerts
│   │   ├── models/                       # Domain models (user, campus, facility, security, spatial, attendance)
│   │   ├── routers/                      # auth, admin, security, guard, facility, worker, student, campus_gpt, spatial
│   │   └── services/                     # websocket_manager, sla_scheduler, campus_gpt_rag, autonomous_ai_sentinel
│   ├── models/                           # MongoDB domain schemas
│   ├── routers/                          # Role-based API routers
│   ├── services/                         # Background services (SLA, AI sentinel, RAG)
│   ├── uploads/                          # proofs, complaints, clips (runtime only — gitignored)
│   ├── .env.example                      # Environment template → copy to .env
│   ├── .env                              # Local secrets (gitignored — never commit)
│   ├── requirements.txt                  # Python dependencies
│   └── seed.py
├── frontend/                             # React 18 + Vite + Tailwind (JSX) SPA
│   ├── src/
│   │   ├── api/axiosClient.js            # Axios instance with auth interceptors
│   │   ├── components/                   # SpatialDigitalTwin2D, CampusMap, CctvEngine, layouts
│   │   ├── context/                      # AuthContext, SocketContext, ThemeContext
│   │   ├── pages/                        # admin, auth, campusPortal, facilityHead, guardApp, securityHead, workerApp
│   │   └── utils/                        # mockAssets, soundEffects
│   ├── index.html
│   ├── postcss.config.js
│   ├── tailwind.config.js                # Campus design system (colors, animations)
│   ├── vite.config.js                    # Vite dev server config (:5173)
│   └── package.json
├── start_platform.ps1                    # Unified launcher: uvicorn :8000 + vite :5173
├── LICENSE                               # MIT License (2026)
├── README.md
└── .gitignore
```

## Getting Started & Local Setup

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.11+ | Backend runtime |
| pip | latest | Python package manager |
| Node.js | 18+ | Frontend runtime |
| npm / yarn | latest | Frontend package manager |
| MongoDB | 4.6+ | Local or MongoDB Atlas instance |
| Git | 2.x | Version control |
| (Optional) Gemini API key | — | Enables CampusGPT RAG & AI Sentinel |

### 1. Clone the Repository

```bash
git clone https://github.com/Anshu2Upadhyay/Smart-Campus-Digital-Twin-Facility-Intelligence.git
cd Smart-Campus-Digital-Twin-Facility-Intelligence
```

### 2. Configure and Start the Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URL, JWT_SECRET_KEY, GEMINI_API_KEY, etc.
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Key environment variables** (full template in `backend/.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `DB_NAME` | `smart_campus_digital_twin` | Database name |
| `JWT_SECRET_KEY` | — | JWT signing secret *(change in production!)* |
| `JWT_ALGORITHM` | `HS256` | Token signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Access token expiry |
| `ELECTRICITY_TARIFF_PER_KWH` | `8.5` | INR ₹ per kWh unit |
| `SLA_SUPERVISOR_AUTOPILOT_SECONDS` | `60` | Supervisor SLA deadline |
| `SLA_WORKER_ACCEPT_SECONDS` | `180` | Worker task-accept deadline |
| `SLA_ESCALATION_SECONDS` | `600` | Escalation timeout |
| `GHOST_ENERGY_VACANT_MINUTES` | `10` | Vacant-room energy anomaly threshold |
| `GEMINI_API_KEY` | — | Google Gemini key (optional AI features) |
| `UPLOAD_DIR` | `uploads` | File upload storage directory |

**Backend endpoints:** API docs `http://localhost:8000/docs` | Health `http://localhost:8000/health`

### 3. Configure and Start the Frontend

```bash
cd ../frontend
npm install        # or: npm i
npm run dev        # Vite dev server → http://localhost:5173
```

**Production build (frontend):**

```bash
cd frontend
npm run build      # Vite production bundle
npm run preview    # Preview production build locally
```

### 4. One-Command Launch (Windows PowerShell)

From the repository root:

```powershell
.\start_platform.ps1
```

This starts the FastAPI backend on `:8000` and the Vite frontend on `:5173` concurrently.

## Role-Based Access Control

| Role | Portal | Primary Responsibilities |
|------|--------|--------------------------|
| `SUPER_ADMIN` | Admin Dashboard | Global audit stream, user/head management, campus setup, CCTV engine |
| `SECURITY_HEAD` | Security Console | GPS radar, incidents/SOS, guard management, CCTV monitoring |
| `SECURITY_GUARD` | Guard Mobile Dashboard | Live duty status, GPS pings, incident response |
| `FACILITY_SUPERVISOR` | Facility Console | Energy monitoring, floor grid, workorders, worker management |
| `GROUND_WORKER` | Worker Mobile Dashboard | Task cards, workorder acceptance, SLA tracking |
| `STUDENT_FACULTY` | Campus Portal | End-user dashboard, CampusGPT queries |

## Author & Credits

**Anshu Upadhyay**  
GitHub: https://github.com/Anshu2Upadhyay

Built as the Smart Campus Digital Twin & Facility Intelligence platform — real-time NOC dashboard, proximity security dispatch, and 6-department facility intelligence.

## License

Distributed under the MIT License. See `LICENSE` for details.

© 2026 Anshu Upadhyay

