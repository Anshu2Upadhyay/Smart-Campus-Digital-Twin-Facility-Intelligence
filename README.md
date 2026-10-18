# Smart Campus Digital Twin & Facility Intelligence Platform

[![MIT License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Motor%20Async-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Sub--Second%20Telemetry-111827)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Computer%20Vision-000000)](https://docs.ultralytics.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Multimodal%20Vision%20%2B%20RAG-8E75B8?logo=google-ai&logoColor=white)](https://ai.google.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Anshu2Upadhyay/Smart-Campus-Digital-Twin-Facility-Intelligence/pulls)

> **Next-Generation Autonomous Campus Operations & Digital Twin Command Center**  
> Unifying real-time 2D/3D architectural spatial digital twins, live CCTV/RTSP surveillance feeds, multimodal AI threat detection (YOLOv8 + Google Gemini), GPS guard radar dispatch, and multi-tier facility energy & SLA autopilot orchestration across 6 dedicated role portals.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [System Architecture](#system-architecture)
- [Core Functional Engines](#core-functional-engines)
  - [1. 2D Architectural Spatial Digital Twin](#1-2d-architectural-spatial-digital-twin)
  - [2. CCTV & RTSP Surveillance Engine](#2-cctv--rtsp-surveillance-engine)
  - [3. Multimodal Autonomous AI Sentinel](#3-multimodal-autonomous-ai-sentinel)
  - [4. GPS Guard Radar & Proximity Dispatch](#4-gps-guard-radar--proximity-dispatch)
  - [5. Facility Intelligence, Energy & SLA Autopilot](#5-facility-intelligence-energy--sla-autopilot)
  - [6. CampusGPT RAG Knowledge Engine](#6-campusgpt-rag-knowledge-engine)
- [Role-Based Portals & Default Credentials](#role-based-portals--default-credentials)
- [Tech Stack](#tech-stack)
- [Repository Directory Structure](#repository-directory-structure)
- [Environment Variables Reference](#environment-variables-reference)
- [Getting Started & Local Setup](#getting-started--local-setup)
  - [Prerequisites](#prerequisites)
  - [One-Command Quick Start](#one-command-quick-start)
  - [Manual Step-by-Step Installation](#manual-step-by-step-installation)
- [API & WebSocket Specification](#api--websocket-specification)
- [Production Deployment Recommendations](#production-deployment-recommendations)
- [Author & License](#author--license)

---

## Executive Summary

The **Smart Campus Digital Twin & Facility Intelligence Platform** bridges physical campus operations and high-fidelity cyber-physical telemetry. Designed for universities, research institutes, and modern enterprise facilities, the platform continuously monitors buildings, rooms, energy consumption, surveillance camera streams, guard locations, and maintenance workflows.

When anomalies occur—such as overcrowding, smoke, unauthorized intrusion, power leakage in vacant rooms, or critical facility breakdown—the platform automatically triggers multi-tiered SLA escalations, dispatches the closest security guard via GPS proximity matching, and alerts command center supervisors in sub-second real time over WebSockets.

---

## System Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PHYSICAL CAMPUS LAYER                                  │
│  [CCTV / RTSP Feeds]   [IoT Power Meters]   [GPS Guard Beacons]   [User Devices & SOS] │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP / RTSP / WebSocket Heartbeats
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FASTAPI BACKEND GATEWAY (:8000)                          │
│                                                                                        │
│  ┌───────────────────────┐  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │    REST API Routers   │  │   WebSocket Gateway     │  │   Autonomous Lifespan    │  │
│  │  • Auth & Pin Login   │  │   /ws/{role}/{userId}   │  │   • SLA Scheduler        │  │
│  │  • Admin & Spatial    │  │   Sub-second telemetry, │  │   • AI Vision Sentinel   │  │
│  │  • Security & Guards  │  │   alerts, and GPS pings │  │   • Ghost Energy Monitor │  │
│  │  • Facility & Workers │  └────────────┬────────────┘  └─────────────┬────────────┘  │
│  │  • CampusGPT (RAG)    │               │                             │               │
│  └──────────┬────────────┘               │                             │               │
│             └────────────────────────────┼─────────────────────────────┘               │
│                                          │                                             │
│  ┌───────────────────────────────────────┴──────────────────────────────────────────┐  │
│  │                           Core Services & Intelligence                           │  │
│  │  • YOLOv8 + OpenCV Frame Processor     • GPS Haversine Proximity Matcher         │  │
│  │  • Google Gemini 1.5 Threat Assessor   • CampusGPT ChromaDB / Vector RAG         │  │
│  └───────────────────────────────────────┬──────────────────────────────────────────┘  │
└──────────────────────────────────────────┼─────────────────────────────────────────────┘
                                           │ Motor Async ODM
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MONGODB DATABASE (2dsphere)                               │
│     [Users & Roles]   [Blocks & SVG Rooms]   [Incidents]   [Workorders]   [Audits]     │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ JSON Telemetry & State Hydration
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            VITE + REACT 18 SPA FRONTEND (:5173)                        │
│                                                                                        │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │ 2D Spatial Digital Twin│  │ Leaflet GPS Campus Map │  │ CCTV Grid & Threat Modal │  │
│  │ SVG Blueprint Renderer │  │ Real-time guard radar  │  │ Live streams + AI bboxes │  │
│  └────────────────────────┘  └────────────────────────┘  └──────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              6 Role-Based NOC Portals                            │  │
│  │  1. Super Admin Console        2. Security Head Console    3. Guard Mobile App   │  │
│  │  4. Facility Supervisor Hub    5. Ground Worker Mobile     6. Student/Staff Desk │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Functional Engines

### 1. 2D Architectural Spatial Digital Twin
- **Dynamic Blueprint Projection:** Renders multi-floor architectural SVG schematics (Block-A, Block-B, Research Center, Auditoriums) with interactive room vectors.
- **Micro-Telemetry Badges:** Real-time occupancy levels, kW electrical load indicators, air-conditioning/lighting states, and room health scores.
- **Specialized Zone Renders:** Tailored SVG styling for conference rooms, labs, server rooms, lecture halls, restrooms, stairs, and elevator shafts.
- **Instant Floor Switching:** Seamless floor traversal (Ground, 1st, 2nd, 3rd) with persisted state synchronization.

### 2. CCTV & RTSP Surveillance Engine
- **Multi-Stream NOC Matrix:** Supports concurrent RTSP, HLS, and synthetic IP video streams across campus quadrants.
- **Camera Configuration & Health:** Live telemetry indicators (FPS, Bitrate, Online/Offline status, PTZ capabilities, and physical room binding).
- **Incident Playback & Freeze Frame:** One-click snapshots with auto-saved forensic audit trails.

### 3. Multimodal Autonomous AI Sentinel
- **YOLOv8 Real-Time Vision:** Edge detection for perimeter intrusion, unauthorized crowding, physical altercations, and smoke/fire hazards.
- **Google Gemini 1.5 Flash Reasoning:** Multimodal image evaluation for nuanced scene understanding, severity scoring (Low/Medium/High/Critical), and automated actionable recommendation synthesis.
- **Autonomous Dispatch Loop:** Auto-converts confirmed AI threats into geo-tagged security incidents within 15 seconds.

### 4. GPS Guard Radar & Proximity Dispatch
- **Sub-Second Guard Pings:** Continuous WebSocket tracking of on-duty patrol personnel with accuracy radii and bearing.
- **Haversine Proximity Matcher:** When an emergency or SOS is reported, the engine calculates real-time distance vectors and auto-suggests or dispatches the closest active security officer.
- **Patrol Route Simulations:** In-browser simulation engine to test guard responses, reroute paths, and verify SLA adherence.

### 5. Facility Intelligence, Energy & SLA Autopilot
- **Ghost Energy Detection:** Flags rooms with zero occupancy running high-load HVAC or lighting systems (>10 min vacancy), computing cost wastage in INR ₹ (configurable tariff).
- **Three-Tier SLA Escalation:**
  - *Tier 1 (Supervisor Dispatch):* 60s countdown for supervisor triage before automatic escalation.
  - *Tier 2 (Worker Acceptance):* 180s countdown for ground worker acknowledgement.
  - *Tier 3 (Executive SLA Breach):* 600s escalation to high-priority audit ledgers if resolution stalls.
- **Workorder Lifecycle:** End-to-end status tracking (`REPORTED` → `ASSIGNED` → `IN_PROGRESS` → `VERIFICATION` → `RESOLVED`).

### 6. CampusGPT RAG Knowledge Engine
- **Vectorized Campus Manuals:** Semantic search over campus policies, emergency guidelines, lab safety protocols, and operational handbooks.
- **Natural Language Assistant:** Instant AI answers for students, faculty, and maintenance staff with grounded citations.

---

## Role-Based Portals & Default Credentials

The platform includes seed data (`backend/app/seed.py`) with pre-configured accounts for all roles:

| Role | Portal Route | Login Mode | Default Username / ID | Default Password / PIN | Core Capabilities |
|------|--------------|------------|-----------------------|------------------------|-------------------|
| **Super Admin** | `/admin` | Official Login | `admin@campus.edu` | `Admin@123` | Global audit log, campus block/room setup, user management, system health |
| **Security Head** | `/security-head` | Official Login | `security.head@campus.edu` | `SecHead@123` | CCTV video wall, GPS guard radar, SOS panic feed, manual & AI dispatch |
| **Security Guard** | `/guard-app` | Staff PIN Login | `SEC-101` / `SEC-104` | `1111` | Mobile-optimized patrol interface, duty toggle, incoming dispatches, GPS beacon |
| **Facility Supervisor** | `/facility-head` | Official Login | `facility.head@campus.edu` | `FacHead@123` | Energy telemetry, ghost power alerts, floor grid, workorder triage |
| **Ground Worker** | `/worker-app` | Staff PIN Login | `FAC-201` / `FAC-202` | `1111` | Mobile job orders, before/after proof upload, countdown SLA timer |
| **Student / Faculty** | `/campus-portal` | Official Login | `rahul@campus.edu` | `Student@123` | Facility issue reporting, room locator, emergency SOS, CampusGPT |

---

## Tech Stack

| Domain | Technology | Description |
|--------|------------|-------------|
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) | High-performance async Python REST & WebSocket API |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org/) | Lightning-fast ASGI web server implementation |
| **Database** | [MongoDB](https://www.mongodb.com/) + [Motor](https://motor.readthedocs.io/) | Non-blocking async document database with 2dsphere indexing |
| **Authentication** | [python-jose](https://github.com/mpduncanson/python-jose) + [passlib/bcrypt](https://passlib.readthedocs.io/) | JWT bearer tokens & salted bcrypt password hashing |
| **Computer Vision** | [Ultralytics YOLOv8](https://docs.ultralytics.com/) + [OpenCV](https://opencv.org/) | On-premise object, crowd, and threat detection |
| **Multimodal AI / RAG** | [Google Gemini](https://ai.google.dev/) + [ChromaDB](https://www.trychroma.com/) | Vision threat reasoning & campus document Q&A |
| **Frontend Framework** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) | Modern fast-refresh JSX single-page application |
| **Styling & UI** | [Tailwind CSS 3](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Curated dark-mode NOC command center design system |
| **Mapping Engine** | [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/) | Geospatial campus tiles, guard markers, and vector polygons |
| **HTTP Client** | [Axios](https://axios-http.com/) | Interceptor-configured client with auto token attachment |

---

## Repository Directory Structure

```text
Smart-Campus-Digital-Twin-Facility-Intelligence/
├── .env.example                          # Root full-stack environment template
├── .gitignore                            # Comprehensive git ignore rules
├── LICENSE                               # MIT License
├── README.md                             # Production architectural documentation
├── start_platform.ps1                    # Unified launcher for Windows PowerShell
├── start_platform.sh                     # Unified launcher for Linux / macOS / WSL
├── backend/                              # FastAPI Backend Application
│   ├── .env.example                      # Backend-specific environment template
│   ├── requirements.txt                  # Python runtime dependencies
│   ├── app/
│   │   ├── main.py                       # FastAPI application entry, CORS & lifespans
│   │   ├── config.py                     # Pydantic v2 BaseSettings configuration
│   │   ├── database.py                   # Async Motor MongoDB connection & indexes
│   │   ├── seed.py                       # Comprehensive initial data seeder
│   │   ├── models/                       # Pydantic domain schemas & Enums
│   │   │   ├── user.py                   # User roles, departments, auth schemas
│   │   │   ├── campus.py                 # Blocks, rooms, cameras, power meters
│   │   │   ├── security.py               # Incidents, threats, guard dispatches
│   │   │   ├── facility.py               # Workorders, energy consumption logs
│   │   │   ├── spatial.py                # 2D/3D polygons, GeoJSON coordinates
│   │   │   └── attendance.py             # Staff roll-call & system audit logs
│   │   ├── routers/                      # Modular API endpoints
│   │   │   ├── auth.py                   # JWT & Staff PIN authentication
│   │   │   ├── admin.py                  # Super Admin endpoints & stats
│   │   │   ├── security_head.py          # Security NOC operations
│   │   │   ├── guard_app.py              # Guard telemetry & duty states
│   │   │   ├── facility_head.py          # Facility supervisor & energy routes
│   │   │   ├── worker_app.py             # Maintenance worker task management
│   │   │   ├── student_portal.py         # End-user reporting & directory
│   │   │   ├── spatial.py                # GeoJSON & 2D SVG spatial coordinates
│   │   │   └── campus_gpt.py             # RAG knowledge base query router
│   │   └── services/                     # Background intelligence & schedulers
│   │       ├── websocket_manager.py      # Multi-channel real-time WebSocket broker
│   │       ├── sla_scheduler.py          # 10s tick SLA autopilot & ghost energy engine
│   │       ├── autonomous_ai_sentinel.py # 15s YOLO + Gemini vision scanner
│   │       ├── vision_engine.py          # OpenCV frame extraction & model runner
│   │       ├── gps_matcher.py            # Haversine proximity dispatch algorithms
│   │       └── campus_gpt_rag.py         # Vector embeddings & document retrieval
│   └── uploads/                          # Local proof images & video forensic storage
└── frontend/                             # React 18 + Vite SPA Client
    ├── .env.example                      # Frontend environment template
    ├── package.json                      # NPM dependencies & build scripts
    ├── vite.config.js                    # Vite server configuration & PWA setup
    ├── tailwind.config.js                # Design system tokens & animations
    ├── postcss.config.js                 # PostCSS Tailwind integration
    ├── index.html                        # Application HTML shell
    ├── public/                           # Static public assets & campus basemaps
    └── src/
        ├── App.jsx                       # Master routing & role-based route guards
        ├── main.jsx                      # React DOM entrypoint
        ├── index.css                     # Tailwind root directives & custom scrollbars
        ├── api/                          # Axios API clients & interceptors
        ├── context/                      # Global React Contexts (Auth, WebSocket, Theme)
        ├── components/                   # Shared UI & visualization engines
        │   ├── SpatialDigitalTwin2D.jsx  # SVG Architectural 2D blueprint engine
        │   ├── CampusMap.jsx             # Leaflet satellite campus basemap
        │   ├── GeminiThreatScanModal.jsx # AI vision threat inspection dialog
        │   ├── Navbar.jsx                # Global navigation bar
        │   └── ProtectedRoute.jsx        # Route security guard
        ├── pages/                        # Role-specific portal views
        │   ├── LandingPage.jsx           # Public portal gateway & role selector
        │   ├── auth/                     # DualLogin, OfficialLogin, StaffPinLogin
        │   ├── admin/                    # Admin dashboards, audits, map engine, CCTV
        │   ├── securityHead/             # CCTV wall, GPS radar, incident command
        │   ├── guardApp/                 # Guard mobile patrol dashboard
        │   ├── facilityHead/             # Energy analytics, floor grids, workorders
        │   ├── workerApp/                # Worker job queue & proof submission
        │   └── campusPortal/             # Student/Faculty self-service & CampusGPT
        └── utils/                        # Mock assets & alert sound synthesizers
```

---

## Environment Variables Reference

### Backend Configuration (`backend/.env`)

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `APP_NAME` | `"Smart Campus Digital Twin..."` | Application display identifier |
| `APP_VERSION` | `"1.0.0"` | Semantic API release version |
| `DEBUG` | `false` | Enable verbose FastAPI debug logs |
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection URI |
| `DB_NAME` | `smart_campus_digital_twin` | Primary database name |
| `JWT_SECRET_KEY` | `campus-digital-twin-...` | Cryptographic secret for signing JWT tokens |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Session lifetime (24 hours default) |
| `ELECTRICITY_TARIFF_PER_KWH` | `8.5` | Commercial electricity tariff (INR ₹ per unit) |
| `SLA_SUPERVISOR_AUTOPILOT_SECONDS` | `60` | Supervisor triage timeout before auto-dispatch |
| `SLA_WORKER_ACCEPT_SECONDS` | `180` | Worker acceptance SLA window (3 minutes) |
| `SLA_ESCALATION_SECONDS` | `600` | Incident resolution SLA deadline (10 minutes) |
| `GHOST_ENERGY_VACANT_MINUTES` | `10` | Inactive room vacancy threshold before power alert |
| `GEMINI_API_KEY` | `""` | Google Gemini API key for AI vision & CampusGPT RAG |
| `UPLOAD_DIR` | `uploads` | Directory for forensic images, clips, and PDF uploads |

### Frontend Configuration (`frontend/.env`)

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Backend REST API base route |
| `VITE_WS_URL` | `ws://localhost:8000` | Backend WebSocket endpoint for real-time telemetry |

---

## Getting Started & Local Setup

### Prerequisites

- **Python 3.11+** installed and available in system PATH.
- **Node.js 18+** and **npm** installed.
- **MongoDB 4.6+** (Community Edition running locally on port `27017` or a MongoDB Atlas connection string).
- **Git 2.x**.

---

### One-Command Quick Start

#### On Windows (PowerShell):
```powershell
.\start_platform.ps1
```

#### On Linux / macOS / WSL (Bash):
```bash
chmod +x ./start_platform.sh
./start_platform.sh
```

Both backend (`http://localhost:8000`) and frontend (`http://localhost:5173`) will launch automatically in parallel.

---

### Manual Step-by-Step Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Anshu2Upadhyay/Smart-Campus-Digital-Twin-Facility-Intelligence.git
cd Smart-Campus-Digital-Twin-Facility-Intelligence
```

#### 2. Configure & Seed Backend
```bash
cd backend

# Setup environment file
cp .env.example .env

# Install Python dependencies
pip install -r requirements.txt

# (Optional) Pre-seed initial database records
python -c "import asyncio; from app.seed import seed_initial_data; asyncio.run(seed_initial_data())"

# Start FastAPI development server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- Healthcheck Endpoint: `http://localhost:8000/health`

#### 3. Configure & Launch Frontend
```bash
cd ../frontend

# Setup frontend environment
cp .env.example .env

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
- Frontend Application: `http://localhost:5173`

#### 4. Building for Production
```bash
cd frontend
npm run build
npm run start    # Serves the compiled production bundle locally on port 4173
```

---

## API & WebSocket Specification

### Primary REST Routes (`/api/v1`)

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/auth/login` | `POST` | Public | Official email/password login returning JWT |
| `/auth/staff-pin-login` | `POST` | Public | Guard & worker 4-digit PIN authentication |
| `/admin/stats/overview` | `GET` | Super Admin | Real-time global campus KPIs & active counts |
| `/security/incidents` | `GET`, `POST` | Security Head | Retrieve incident ledger or raise new threat |
| `/security/guards/radar` | `GET` | Security Head | Current GPS coordinates & status of all guards |
| `/guard/duty-status` | `PUT` | Security Guard | Update online/offline duty status |
| `/guard/gps-ping` | `POST` | Security Guard | Ingest mobile guard GPS coordinates |
| `/facility/energy/overview`| `GET` | Facility Head | Live campus kW consumption & ghost energy logs |
| `/facility/workorders` | `GET`, `POST` | Facility Head | Manage maintenance workorders & assign workers |
| `/worker/tasks` | `GET`, `PUT` | Ground Worker | Retrieve assigned jobs & submit completion proof |
| `/campus-gpt/query` | `POST` | All Users | Query AI RAG knowledge base |

### Real-Time WebSocket Channel (`/ws/{role}/{userId}`)

Clients establish a persistent WebSocket connection to stream bidirectional events:
```json
{
  "event_type": "GPS_PING | INCIDENT_RAISED | SLA_ALERT | GHOST_ENERGY_DETECTED",
  "timestamp": "2026-10-18T15:30:00Z",
  "payload": {
    "block_id": "BLK-B",
    "room_id": "RM-204",
    "threat_level": "CRITICAL",
    "description": "Suspicious smoke detected by AI Vision Sentinel."
  }
}
```

---

## Production Deployment Recommendations

1. **Reverse Proxy:** Terminate TLS (HTTPS/WSS) via Nginx or Cloudflare, proxying `/api` and `/ws` to Uvicorn (:8000) and `/` to Vite's static build output or a Node cluster.
2. **Database:** Deploy MongoDB Atlas with replica sets and automated backups. Ensure the `2dsphere` index on `users.location` and `rooms.geometry` is active.
3. **Containerization:** Create Docker multi-stage builds (`backend/Dockerfile` and `frontend/Dockerfile`) orchestrated via `docker-compose.yml`.
4. **AI Inference Acceleration:** When running YOLOv8 in high-density environments, enable CUDA GPU passthrough for sub-second video frame classification.

---

## Author & License

- **Author:** [Anshu Upadhyay](https://github.com/Anshu2Upadhyay)
- **Repository:** [Smart-Campus-Digital-Twin-Facility-Intelligence](https://github.com/Anshu2Upadhyay/Smart-Campus-Digital-Twin-Facility-Intelligence)
- **License:** Distributed under the [MIT License](LICENSE).
