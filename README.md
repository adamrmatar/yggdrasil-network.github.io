# Yggdrasil Commander

**Sovereign Simplicity** — A clean, minimal GUI for managing your Yggdrasil network node.

Yggdrasil Commander is designed to compete with Tailscale on ease of use while maintaining complete sovereignty—no central accounts, no third-party dependencies.

## Features

- 🎯 **Sovereign**: No external accounts or centralized services
- 🎨 **Clean Design**: Minimalist interface inspired by Apple system utilities
- 🐳 **Docker Native**: One-command deployment with Docker Compose
- 🔧 **Full Control**: Direct access to your Yggdrasil node via admin socket

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Python 3.11 (Flask)
- **Infrastructure**: Docker Compose
- **Network**: Yggdrasil official Docker image

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Port 80 available on your host

### Launch

```bash
# Clone the repository
git clone https://github.com/adamrmatar/yggdrasil-network.github.io.git
cd yggdrasil-network.github.io

# Start all services
docker-compose up --build
```

The interface will be available at `http://localhost`

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  Docker Compose                                      │
│  ┌────────────────────┐  ┌──────────────────────┐  │
│  │  Yggdrasil Node    │  │  Yggdrasil Commander │  │
│  │  (network: host)   │  │  (Next.js + Flask)   │  │
│  │                    │  │                       │  │
│  │  /var/run/yggdrasil│◄─┤  Mounts socket       │  │
│  │  /yggdrasil.sock   │  │  (read-only)         │  │
│  └────────────────────┘  │                       │  │
│                          │  Port: 80             │  │
│                          └──────────────────────┬┘  │
└─────────────────────────────────────────────────┼───┘
                                                   │
                                            http://localhost
```

## Design Philosophy

**Sovereign Simplicity** guides every design decision:

- **Monochrome Palette**: Clean slate grays (slate-50 to slate-900)
- **Single Accent**: Emerald-500 for active states and primary actions
- **Minimal UI**: No unnecessary elements or complex dashboards
- **Native Feel**: Inspired by Apple system utilities

## Project Structure

```
.
├── docker-compose.yml          # Orchestrates Yggdrasil + App
├── Dockerfile                  # Multi-stage build (Node + Python)
├── backend/
│   ├── app.py                  # Flask API server
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   └── components/         # Reusable UI components
│   ├── package.json
│   ├── next.config.js          # Static export configuration
│   └── tailwind.config.ts      # Tailwind with sovereign palette
└── README.md
```

## Development

### Frontend Development

```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:3000
```

### Backend Development

```bash
cd backend
pip install -r requirements.txt
python app.py
# API available at http://localhost:5000
```

### Production Build

```bash
# Build and run with Docker Compose
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Endpoints

- `GET /api/status` - Backend and Yggdrasil socket health check
- `GET /api/node/info` - Node information (implementation pending)

## Roadmap

- [x] Basic UI scaffold with navigation
- [x] Backend API with socket detection
- [x] Full stack integration
- [ ] Yggdrasil admin socket communication
- [ ] Peer management interface
- [ ] Real-time node statistics
- [ ] Configuration editor
- [ ] Network visualization

## Contributing

This project is in active development. Contributions welcome!

## License

MIT

---

**Vibed with [Shakespeare](https://shakespeare.diy)**
