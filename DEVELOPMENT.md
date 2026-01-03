# Yggdrasil Commander - Development Guide

## Project Structure

```
yggdrasil-commander/
├── docker-compose.yml       # Orchestrates all services
├── Dockerfile               # Multi-stage build (Node.js + Python)
├── package.json             # Root workspace configuration
├── backend/                 # Python/Flask API
│   ├── app.py              # Main Flask application
│   └── requirements.txt    # Python dependencies
└── frontend/               # Next.js application
    ├── src/
    │   ├── app/            # Next.js App Router pages
    │   │   ├── layout.tsx  # Root layout with sidebar
    │   │   ├── page.tsx    # Dashboard page
    │   │   ├── peers/      # Peers management page
    │   │   └── settings/   # Settings page
    │   └── components/     # Reusable React components
    │       ├── Sidebar.tsx
    │       └── StatusCard.tsx
    ├── next.config.js      # Next.js configuration (static export)
    ├── tailwind.config.ts  # Tailwind CSS configuration
    ├── tsconfig.json       # TypeScript configuration
    └── package.json        # Frontend package configuration
```

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js 20+** (for local development)
- **Python 3.11+** (for local backend development)

### Quick Start with Docker

The easiest way to run the complete stack:

```bash
# Start all services (Yggdrasil + Commander)
docker-compose up --build

# Access the interface
open http://localhost
```

This will:
1. Start the Yggdrasil node (network_mode: host)
2. Build the Next.js frontend
3. Start the Flask backend serving the built frontend
4. Expose the interface on port 80

### Local Development

For faster iteration during development, run the frontend and backend separately:

#### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000` with hot reload.

#### Backend Development

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The API will be available at `http://localhost:5000`.

**Note**: When developing locally, the backend won't have access to the Yggdrasil socket unless you're running Yggdrasil on your machine.

## Architecture

### Services

1. **yggdrasil**: Official Yggdrasil Docker image
   - Runs with `network_mode: host` for full network access
   - Privileged mode for network configuration
   - Exposes admin socket via volume mount

2. **app**: Custom application container
   - Multi-stage build (Node.js → Python)
   - Flask serves the static Next.js build
   - Mounts Yggdrasil socket (read-only)

### Data Flow

```
User Browser
    ↓
Flask (Port 5000 → 80)
    ├── Serves Next.js static files (/)
    └── API endpoints (/api/*)
            ↓
    Yggdrasil Admin Socket
    (/var/run/yggdrasil/yggdrasil.sock)
```

## API Endpoints

### Core Endpoints

#### `GET /api/status`
Health check - reports backend and socket status

#### `GET /api/self`
Get node information (address, key, coords, subnet)

#### `GET /api/peers`
List all connected peers

#### `GET /api/invite`
Generate QR code invite for peer connections

#### `POST /api/bootstrap`
**Magic Button** - Automatically add public peers and connect

#### `POST /api/exit-node`
Enable/disable exit node (VPN gateway) functionality

**Full API documentation**: See [`backend/API.md`](backend/API.md)

## Design System

### Color Palette (Sovereign Simplicity)

- **Background**: `slate-50` (#f8fafc)
- **Surfaces**: `white` with `slate-200` borders
- **Text**: `slate-900` (primary), `slate-600` (secondary)
- **Accent**: `emerald-500` (#10b981) - for active states only
- **Status Colors**:
  - Active: `emerald-500`
  - Inactive: `slate-400`
  - Error: `red-500`

### Typography

- **Font**: Inter (system font fallback)
- **Headings**: `font-light` to `font-semibold`
- **Body**: `font-normal`
- **Code**: `font-mono`

### Components

**StatusCard**: Displays service/node status with animated indicator
```tsx
<StatusCard
  title="Backend API"
  status="active" // 'active' | 'inactive' | 'error'
  details="Version 0.1.0"
/>
```

**Sidebar**: Persistent navigation with icon + label format

## Building for Production

### Full Docker Build

```bash
# Build and start in detached mode
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Manual Build (Advanced)

```bash
# Build frontend
cd frontend
npm run build  # Outputs to frontend/out/

# Build Docker image
cd ..
docker build -t yggdrasil-commander .

# Run container
docker run -p 80:5000 \
  -v yggdrasil-socket:/var/run/yggdrasil:ro \
  yggdrasil-commander
```

## Troubleshooting

### "Yggdrasil socket: disconnected"

- Verify Yggdrasil container is running: `docker ps | grep yggdrasil`
- Check socket volume: `docker volume ls | grep yggdrasil`
- Inspect socket permissions: `docker exec yggdrasil-node ls -la /var/run/yggdrasil/`

### Frontend build fails

- Clear Next.js cache: `cd frontend && rm -rf .next out`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

### Port 80 already in use

- Change the port in `docker-compose.yml`:
  ```yaml
  ports:
    - "8080:5000"  # Access on localhost:8080 instead
  ```

## Contributing

1. Make changes in your local environment
2. Test with `docker-compose up --build`
3. Ensure all TypeScript/ESLint checks pass: `cd frontend && npm run lint`
4. Submit a pull request

## Roadmap

- [x] Implement Yggdrasil admin socket communication
- [x] Zero-config bootstrap with public peers
- [x] Exit node (VPN gateway) support
- [x] QR code invite generation
- [x] Peer management interface (UI)
- [x] Real-time node statistics dashboard
- [x] First-run wizard with confetti
- [x] Settings page with exit node toggle
- [ ] Manual peer addition endpoint
- [ ] Network topology visualization
- [ ] Multi-node management
- [ ] WebSocket real-time updates

## License

MIT
