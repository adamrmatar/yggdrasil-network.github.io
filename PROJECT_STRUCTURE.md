# Yggdrasil Commander - Project Structure

```
yggdrasil-commander/
│
├── docker-compose.yml          # 🐳 Orchestrates Yggdrasil node + Commander app
├── Dockerfile                  # 🏗️  Multi-stage build (Node.js → Python)
├── package.json                # 📦 Root workspace configuration
├── start.sh                    # 🚀 Quick start script
├── .env.example                # ⚙️  Environment configuration template
├── .dockerignore               # 🚫 Docker build exclusions
├── .gitignore                  # 🚫 Git exclusions
│
├── README.md                   # 📖 Main documentation
├── DEVELOPMENT.md              # 🛠️  Development guide
└── PROJECT_STRUCTURE.md        # 📁 This file
│
├── backend/                    # 🐍 Python/Flask API server
│   ├── app.py                  # Main Flask application
│   └── requirements.txt        # Python dependencies
│
└── frontend/                   # ⚛️  Next.js application
    ├── package.json            # Frontend package configuration
    ├── next.config.js          # Next.js config (static export)
    ├── tsconfig.json           # TypeScript configuration
    ├── tailwind.config.ts      # Tailwind CSS (Sovereign palette)
    ├── postcss.config.mjs      # PostCSS configuration
    │
    └── src/
        ├── app/                # Next.js App Router
        │   ├── layout.tsx      # Root layout with Sidebar
        │   ├── globals.css     # Global styles + Tailwind
        │   ├── page.tsx        # Dashboard page
        │   ├── peers/
        │   │   └── page.tsx    # Peers management page
        │   └── settings/
        │       └── page.tsx    # Settings page
        │
        └── components/         # Reusable React components
            ├── Sidebar.tsx     # Navigation sidebar
            └── StatusCard.tsx  # Status display card
```

## File Descriptions

### Root Level

- **docker-compose.yml**: Defines two services:
  - `yggdrasil`: Official Yggdrasil node (network: host, privileged)
  - `app`: Commander application (Flask + Next.js build)

- **Dockerfile**: Multi-stage build:
  1. Build Next.js frontend → static files
  2. Setup Python environment + Flask
  3. Copy frontend build + backend code

- **package.json**: Workspace root that manages frontend dependencies

- **start.sh**: Convenience script to check prerequisites and start services

### Backend (`backend/`)

- **app.py**: Flask server that:
  - Serves Next.js static build from `frontend/out/`
  - Provides API endpoints (`/api/status`, `/api/node/info`)
  - Connects to Yggdrasil admin socket

- **requirements.txt**: Python dependencies:
  - Flask 3.0.0
  - Flask-CORS 4.0.0
  - Werkzeug 3.0.1

### Frontend (`frontend/`)

#### Configuration Files

- **next.config.js**: Configures static export for Docker deployment
- **tsconfig.json**: TypeScript strict mode + path aliases
- **tailwind.config.ts**: Custom Sovereign Simplicity palette
- **postcss.config.mjs**: PostCSS + Tailwind + Autoprefixer

#### Source Code (`src/`)

**App Router (`src/app/`):**
- **layout.tsx**: Persistent layout with Sidebar navigation
- **globals.css**: Tailwind imports + custom scrollbar styles
- **page.tsx**: Dashboard with status polling and StatusCard components
- **peers/page.tsx**: Placeholder for peer management
- **settings/page.tsx**: Placeholder for configuration

**Components (`src/components/`):**
- **Sidebar.tsx**: Left navigation with icon-based menu (Dashboard, Peers, Settings)
- **StatusCard.tsx**: Reusable status display with animated indicators

## Design Philosophy: Sovereign Simplicity

Every file follows these principles:

1. **Minimal Dependencies**: Only essential packages
2. **Clean Separation**: Frontend ↔ API ↔ Yggdrasil socket
3. **Stateless Frontend**: All state comes from API calls
4. **Docker-First**: Everything runs in containers
5. **No Lock-In**: No proprietary services or accounts

## Build Flow

```
Developer
    ↓
docker-compose up --build
    ↓
┌─────────────────────┐
│ Dockerfile Stage 1  │  Build Next.js (npm run build)
│ (Node 20)           │  → frontend/out/
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Dockerfile Stage 2  │  Setup Python + Flask
│ (Python 3.11)       │  Copy backend/ + frontend/out/
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Docker Compose      │  Start yggdrasil + app
│                     │  Mount socket volume
└──────────┬──────────┘
           ↓
    Browser (localhost:80)
```

## API Routes

```
/                       → Serves frontend/out/index.html
/peers/                 → Serves frontend/out/peers.html
/settings/              → Serves frontend/out/settings.html

/api/status             → { status, yggdrasil_socket, ... }
/api/node/info          → { address, subnet, public_key, ... } [TODO]
```

## Next Steps

1. Implement Yggdrasil admin socket communication in `backend/app.py`
2. Build peer management UI in `frontend/src/app/peers/page.tsx`
3. Add real-time statistics with WebSockets or Server-Sent Events
4. Create configuration editor in `frontend/src/app/settings/page.tsx`

---

**Vibed with [Shakespeare](https://shakespeare.diy)**
