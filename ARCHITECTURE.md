# Yggdrasil Commander - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Docker Compose                              │
│                                                                       │
│  ┌────────────────────────────┐  ┌────────────────────────────────┐ │
│  │   Yggdrasil Node           │  │   Yggdrasil Commander          │ │
│  │   (Official Image)         │  │   (Custom Build)               │ │
│  │                            │  │                                │ │
│  │  - network_mode: host      │  │  ┌──────────────────────────┐ │ │
│  │  - privileged: true        │  │  │  Frontend (Next.js)      │ │ │
│  │                            │  │  │  - Static build in /out  │ │ │
│  │  Creates:                  │  │  │  - Served by Flask       │ │ │
│  │  /var/run/yggdrasil/       │  │  └──────────────────────────┘ │ │
│  │    yggdrasil.sock ◄───────────┼─────── Volume Mount (ro)       │ │
│  │                            │  │                                │ │
│  │  /etc/yggdrasil/           │  │  ┌──────────────────────────┐ │ │
│  │    yggdrasil.conf ◄───────────┼─────── Volume Mount (rw)       │ │
│  │                            │  │  │  Backend (Flask)         │ │ │
│  └────────────────────────────┘  │  │  - YggdrasilSocket       │ │ │
│                                   │  │  - API Endpoints         │ │ │
│                                   │  │  - Config Management     │ │ │
│                                   │  └──────────────────────────┘ │ │
│                                   │                                │ │
│                                   │  Port: 80 → 5000               │ │
│                                   └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                           http://localhost
```

---

## Request Flow

### Static File Request (e.g., `/`, `/peers`)

```
Browser
   │
   │ GET /
   ▼
Flask (app.py)
   │
   │ serve_frontend()
   ▼
/frontend/out/index.html
   │
   ▼
Browser (React App Loads)
```

### API Request (e.g., `/api/self`)

```
Browser
   │
   │ GET /api/self
   ▼
Flask (app.py)
   │
   │ @app.route('/api/self')
   ▼
YggdrasilSocket
   │
   │ send_command('getSelf')
   ▼
Unix Socket
   │
   │ /var/run/yggdrasil/yggdrasil.sock
   ▼
Yggdrasil Node
   │
   │ JSON-RPC Response
   ▼
YggdrasilSocket
   │
   │ Parse & Return
   ▼
Flask
   │
   │ jsonify({ address, key, coords })
   ▼
Browser
```

### Bootstrap Request (Complex)

```
Browser
   │
   │ POST /api/bootstrap
   ▼
Flask (app.py)
   │
   │ @app.route('/api/bootstrap')
   ▼
requests.get()
   │
   │ Fetch public peer list
   ▼
publicpeers.neilalexander.dev
   │
   │ JSON peer list
   ▼
Flask (Peer Selection)
   │
   │ Filter by region (US/Europe)
   │ Random select 3 peers
   ▼
read_yggdrasil_config()
   │
   │ Parse /etc/yggdrasil/yggdrasil.conf
   ▼
Config Modification
   │
   │ Append peers to Peers array
   │ Deduplicate
   ▼
write_yggdrasil_config()
   │
   │ Write JSON to /etc/yggdrasil/yggdrasil.conf
   ▼
reload_yggdrasil()
   │
   │ kill -HUP $(pidof yggdrasil)
   ▼
Yggdrasil Node
   │
   │ Reload config, connect to peers
   ▼
Flask
   │
   │ jsonify({ status: 'bootstrapped', peers_added: [...] })
   ▼
Browser
```

---

## Component Architecture

### Frontend (Next.js 14)

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Sidebar
│   │   └── Sidebar.tsx     # Navigation component
│   │
│   ├── page.tsx            # Dashboard
│   │   ├── useEffect()     # Polls /api/status every 5s
│   │   └── StatusCard      # Displays status
│   │
│   ├── peers/
│   │   └── page.tsx        # Peer management (TODO)
│   │
│   └── settings/
│       └── page.tsx        # Configuration (TODO)
│
└── components/
    ├── Sidebar.tsx         # Left navigation
    └── StatusCard.tsx      # Reusable status display
```

**Build Process**:
```
npm run build
    │
    ▼
Next.js Static Export
    │
    ▼
frontend/out/
    ├── index.html
    ├── peers.html
    ├── settings.html
    ├── _next/static/...
    └── ...
```

---

### Backend (Python 3.11 + Flask)

```
backend/
├── app.py                  # Main Flask application
│   │
│   ├── YggdrasilSocket     # Socket communication class
│   │   └── send_command()  # JSON-RPC wrapper
│   │
│   ├── Endpoints           # API routes
│   │   ├── /api/status
│   │   ├── /api/self
│   │   ├── /api/peers
│   │   ├── /api/invite
│   │   ├── /api/bootstrap
│   │   └── /api/exit-node
│   │
│   └── Helpers
│       ├── read_yggdrasil_config()
│       ├── write_yggdrasil_config()
│       └── reload_yggdrasil()
│
├── requirements.txt        # Dependencies
├── test_app.py            # Test suite
└── API.md                 # Documentation
```

---

## Data Models

### Node Information (`/api/self`)

```python
{
    "address": str,      # IPv6 address (e.g., "200:1234::1")
    "key": str,          # Public key (hex)
    "coords": str,       # Network coordinates (e.g., "[1 2 3]")
    "subnet": str        # IPv6 subnet (e.g., "300:1234::/64")
}
```

### Peer Information (`/api/peers`)

```python
{
    "peers": [
        {
            "address": str,      # Peer IPv6
            "key": str,          # Peer public key
            "port": int,         # Connection port
            "uptime": int,       # Seconds connected
            "bytes_sent": int,   # Traffic statistics
            "bytes_recv": int
        }
    ]
}
```

### Configuration Structure

```python
{
    "Peers": [
        "tcp://peer1.example.com:9001",
        "tcp://peer2.example.com:9001",
        # ...
    ],
    "TunnelRouting": {
        "Enable": bool,
        "IPv6Destinations": ["::/0"],  # Exit node route
        "IPv6Sources": [],
        "IPv4Destinations": [],
        "IPv4Sources": []
    },
    "AdminListen": "unix:///var/run/yggdrasil/yggdrasil.sock"
    # ... other Yggdrasil config
}
```

---

## Communication Protocols

### 1. HTTP/REST (Frontend ↔ Backend)

```
GET /api/self
    ↓
200 OK
Content-Type: application/json

{
  "address": "200:1234::1",
  "key": "abc123...",
  "coords": "[1 2 3]"
}
```

### 2. JSON-RPC (Backend ↔ Yggdrasil)

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getSelf"
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "address": "200:1234::1",
    "key": "abc123...",
    "coords": "[1 2 3]"
  }
}
```

### 3. Unix Socket

```
Flask Process
    │
    │ socket.socket(AF_UNIX, SOCK_STREAM)
    │ connect('/var/run/yggdrasil/yggdrasil.sock')
    ▼
Yggdrasil Process
    │
    │ Listen on Unix socket
    │ Parse JSON-RPC
    ▼
Network Operations
```

---

## Security Model

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Unauthorized socket access | Volume mount with `:ro` flag |
| Config file tampering | Atomic writes, validation |
| Exit node abuse | UI warnings, easy disable |
| Public peer MitM | Use HTTPS for peer list fetch |
| Container escape | Run as non-root (TODO) |

### Trust Boundaries

```
┌──────────────────────────────────────────────┐
│  Docker Host (Trusted)                       │
│                                              │
│  ┌─────────────────────────────────────────┐│
│  │  Yggdrasil Container (Trusted)          ││
│  │  - Full network access                  ││
│  │  - Privileged mode                      ││
│  └─────────────────────────────────────────┘│
│                                              │
│  ┌─────────────────────────────────────────┐│
│  │  Commander Container (Semi-Trusted)     ││
│  │  - Read-only socket access              ││
│  │  - Read-write config access             ││
│  │  - No network_mode: host                ││
│  └─────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
         │
         │ HTTP (Port 80)
         ▼
┌──────────────────────────────────────────────┐
│  User Browser (Untrusted)                    │
│  - CORS-protected API access                 │
│  - No direct socket access                   │
└──────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Current Limitations

- Single-threaded Flask (dev server)
- Synchronous socket I/O
- No connection pooling
- No caching

### Production Recommendations

1. **Use Gunicorn**:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```
   - 4 worker processes
   - Handle concurrent requests

2. **Add Nginx Reverse Proxy**:
   ```
   Browser → Nginx (443) → Gunicorn (5000) → Flask
   ```
   - HTTPS termination
   - Static file caching
   - Rate limiting

3. **Enable Caching**:
   ```python
   @cache.cached(timeout=60)
   def api_self():
       # Cache node info for 60 seconds
   ```

4. **Use Async**:
   ```python
   # Convert to FastAPI or Flask + gevent
   @app.route('/api/bootstrap')
   async def api_bootstrap():
       await asyncio.gather(
           fetch_peers(),
           read_config(),
           write_config()
       )
   ```

---

## Monitoring & Observability

### Metrics to Track

```
Application Metrics:
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (5xx responses)
- Socket connection failures

Yggdrasil Metrics:
- Peer count
- Bandwidth usage
- Session uptime
- DHT size

System Metrics:
- Container CPU/memory
- Disk I/O (config writes)
- Network throughput
```

### Logging Strategy

```python
# Structured logging (TODO)
logger.info("bootstrap_started", extra={
    "peer_count": 3,
    "region": "us-europe"
})

logger.info("bootstrap_completed", extra={
    "peers_added": ["tcp://peer1", "tcp://peer2"],
    "duration_ms": 1250
})
```

---

## Deployment Scenarios

### Scenario 1: Home Server (Umbrel, StartOS)

```
Raspberry Pi / NUC
    │
    ├── Docker Engine
    │   └── docker-compose.yml
    │       ├── yggdrasil
    │       └── commander
    │
    └── Local Network Access
        └── http://192.168.1.100
```

### Scenario 2: VPS (Cloud Provider)

```
Cloud VM (Ubuntu 22.04)
    │
    ├── Docker Engine
    ├── Nginx (Reverse Proxy)
    │   └── HTTPS (Let's Encrypt)
    │       └── docker-compose.yml
    │
    └── Public Internet
        └── https://ygg.example.com
```

### Scenario 3: Development (Local Machine)

```
Developer Laptop
    │
    ├── Frontend (npm run dev)
    │   └── http://localhost:3000
    │
    └── Backend (python app.py)
        └── http://localhost:5000
```

---

## Build Pipeline

```
git push
    │
    ▼
Docker Build
    │
    ├── Stage 1: Frontend Build
    │   ├── npm install
    │   ├── npm run build
    │   └── frontend/out/
    │
    └── Stage 2: Backend Setup
        ├── pip install -r requirements.txt
        ├── COPY backend/
        ├── COPY frontend/out/
        └── CMD ["python", "backend/app.py"]
    │
    ▼
Docker Image
    │
    ▼
docker-compose up
    │
    ├── Pull yggdrasil:latest
    └── Build commander:latest
    │
    ▼
Running Containers
    │
    ▼
http://localhost
```

---

## Future Architecture

### WebSocket Integration

```
Browser
    │
    │ WebSocket (ws://localhost/ws)
    ▼
Flask-SocketIO
    │
    │ Real-time events
    ▼
Browser
    │
    └── Live Updates:
        ├── Peer connect/disconnect
        ├── Bandwidth statistics
        └── Node status changes
```

### Multi-Node Management

```
Commander Instance
    │
    ├── Node 1 (192.168.1.10)
    ├── Node 2 (192.168.1.11)
    └── Node 3 (192.168.1.12)
    │
    └── Aggregate Dashboard
        ├── Total peers
        ├── Total bandwidth
        └── Network topology
```

---

**Version**: 0.2.0  
**Last Updated**: 2026-01-03

---

**Vibed with [Shakespeare](https://shakespeare.diy)**
