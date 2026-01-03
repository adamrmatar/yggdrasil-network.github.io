# Yggdrasil Commander - Backend

Python/Flask API server for sovereign Yggdrasil network management.

## Architecture

```
Flask App (app.py)
    ↓
YggdrasilSocket Class
    ↓
Unix Socket (/var/run/yggdrasil/yggdrasil.sock)
    ↓
Yggdrasil Node (JSON-RPC)
```

## Features

✅ **JSON-RPC Socket Communication**
- Direct communication with Yggdrasil admin socket
- Robust error handling and timeout management
- Automatic reconnection logic

✅ **Zero-Config Bootstrap**
- Fetches public peer list from community sources
- Automatically selects low-latency peers (US/Europe)
- One-click connection to the network

✅ **QR Code Invites**
- Generates shareable peering QR codes
- Base64-encoded images for easy embedding
- Mobile-friendly scanning

✅ **Exit Node Management**
- Enable/disable VPN gateway mode
- Route advertisement (`::/0`)
- Automatic configuration reload

✅ **Configuration Management**
- Safe read/write of `yggdrasil.conf`
- JSON and TOML format support
- Atomic configuration updates

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py

# Run tests
python test_app.py
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Flask | 3.0.0 | Web framework |
| Flask-CORS | 4.0.0 | Cross-origin requests |
| qrcode[pil] | 7.4.2 | QR code generation |
| requests | 2.31.0 | HTTP client |
| toml | 0.10.2 | Config file parsing |

## API Reference

See [API.md](API.md) for complete endpoint documentation.

### Quick Reference

```bash
# Health check
curl http://localhost:5000/api/status

# Get node info
curl http://localhost:5000/api/self

# List peers
curl http://localhost:5000/api/peers

# Generate invite QR code
curl http://localhost:5000/api/invite

# Bootstrap with public peers
curl -X POST http://localhost:5000/api/bootstrap

# Enable exit node
curl -X POST http://localhost:5000/api/exit-node \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `YGGDRASIL_SOCKET` | `/var/run/yggdrasil/yggdrasil.sock` | Admin socket path |
| `FLASK_ENV` | `production` | Flask environment |

## YggdrasilSocket Class

Core abstraction for Yggdrasil communication.

### Usage

```python
from app import YggdrasilSocket

# Create socket instance
ygg = YggdrasilSocket()

# Get node information
result = ygg.send_command('getSelf')
print(f"Address: {result['address']}")
print(f"Key: {result['key']}")

# Get peers
peers = ygg.send_command('getPeers')
print(f"Connected peers: {len(peers['peers'])}")

# Add peer
ygg.send_command('addPeer', {
    'uri': 'tcp://peer.example.com:9001'
})
```

### Available RPC Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getSelf` | - | Get node information |
| `getPeers` | - | List connected peers |
| `addPeer` | `{uri: string}` | Add a peer |
| `removePeer` | `{port: int}` | Remove a peer |
| `getDHT` | - | Get DHT information |
| `getSessions` | - | Get session information |

## Error Handling

All functions use try/except blocks with specific error types:

```python
try:
    ygg = YggdrasilSocket()
    result = ygg.send_command('getSelf')
except ConnectionError as e:
    # Socket not found or connection failed
    print(f"Connection error: {e}")
except ValueError as e:
    # Invalid JSON or RPC error
    print(f"Protocol error: {e}")
except RuntimeError as e:
    # Unexpected error
    print(f"Runtime error: {e}")
```

## Testing

### Unit Tests

```bash
# Run all tests
python test_app.py

# With pytest (recommended)
pip install pytest pytest-cov
pytest test_app.py -v

# With coverage
pytest test_app.py --cov=app --cov-report=html
```

### Manual Testing

```bash
# Test socket connection
python -c "from app import YggdrasilSocket; ygg = YggdrasilSocket(); print(ygg.send_command('getSelf'))"

# Test config read/write
python -c "from app import read_yggdrasil_config; print(read_yggdrasil_config())"
```

## Production Deployment

### With Gunicorn (Recommended)

```bash
pip install gunicorn

gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### With Docker

Already configured in the main `Dockerfile`. The multi-stage build:
1. Builds Next.js frontend
2. Installs Python dependencies
3. Copies frontend build to backend
4. Runs Flask server

## Security

### Socket Access

The admin socket provides **full control** over Yggdrasil:
- ✅ Use read-only volume mounts when possible
- ✅ Restrict file permissions on socket
- ✅ Run with minimal required privileges

### Configuration Writes

Writing to `/etc/yggdrasil/yggdrasil.conf` requires appropriate permissions:
- Container should have write access to `/etc/yggdrasil/`
- Consider using a separate config directory for non-root deployments

### Exit Node Mode

Running as an exit node exposes your connection:
- ⚠️ Understand legal implications
- ⚠️ Check ISP terms of service
- ⚠️ Configure firewall appropriately
- ⚠️ Monitor traffic patterns

## Troubleshooting

### "Socket not found"

**Problem**: `ConnectionError: Yggdrasil socket not found`

**Solutions**:
1. Verify Yggdrasil is running: `docker ps | grep yggdrasil`
2. Check socket volume: `docker volume inspect yggdrasil-socket`
3. Verify socket permissions: `ls -la /var/run/yggdrasil/`

### "Config write failed"

**Problem**: `Failed to write configuration`

**Solutions**:
1. Check directory permissions: `ls -la /etc/yggdrasil/`
2. Verify volume mount in `docker-compose.yml`
3. Try with elevated privileges (not recommended for production)

### "Reload failed"

**Problem**: `reload_success: false`

**Solutions**:
1. Check if process exists: `pidof yggdrasil`
2. Verify signal permissions: Container may need `CAP_KILL`
3. Manual reload: `docker exec yggdrasil-node kill -HUP 1`

### "No public peers available"

**Problem**: Bootstrap returns empty peer list

**Solutions**:
1. Check network connectivity: `curl https://publicpeers.neilalexander.dev/publicnodes.json`
2. Verify JSON format of peer list
3. Use manual peer addition as fallback

## Development Workflow

1. **Local Testing**:
   ```bash
   # Terminal 1: Run backend
   python app.py
   
   # Terminal 2: Test endpoints
   curl http://localhost:5000/api/status
   ```

2. **Docker Testing**:
   ```bash
   # Build and run
   docker-compose up --build
   
   # Check logs
   docker-compose logs -f app
   ```

3. **Make Changes**:
   - Edit `app.py`
   - Run tests: `python test_app.py`
   - Rebuild: `docker-compose up --build`

## Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Peer blacklist/whitelist management
- [ ] Bandwidth statistics tracking
- [ ] Multi-node management API
- [ ] Configuration backup/restore
- [ ] Health check scheduling
- [ ] Prometheus metrics export

## License

MIT

---

**Vibed with [Shakespeare](https://shakespeare.diy)**
