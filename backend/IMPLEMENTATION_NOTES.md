# Backend Implementation Notes

## Overview

This document details the implementation of the Yggdrasil Commander backend - a zero-config Python/Flask API that transforms Yggdrasil network management into a one-click appliance experience.

---

## Architecture Decisions

### 1. YggdrasilSocket Class

**Problem**: Need reliable communication with Yggdrasil admin socket

**Solution**: Custom wrapper class with:
- Unix socket connection management
- JSON-RPC request/response handling
- Automatic timeout (5 seconds)
- Graceful error handling
- Connection pooling (future enhancement)

**Why not existing libraries?**
- Yggdrasil uses newline-delimited JSON over Unix socket
- Standard JSON-RPC clients don't handle Unix sockets well
- Custom implementation gives us full control

**Code highlights**:
```python
def send_command(self, method, params=None):
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.settimeout(5)
    sock.connect(self.socket_path)
    
    request_json = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    })
    
    sock.sendall(request_json.encode('utf-8') + b'\n')
    # ... receive and parse response
```

---

### 2. Configuration Management

**Problem**: Yggdrasil config can be JSON, HJSON, or TOML-like

**Solution**: Multi-format parser with fallbacks
1. Try JSON first (fastest, most common)
2. Fall back to TOML (handles comments)
3. Return mock config if file doesn't exist (dev mode)

**Why this matters**:
- Robustness in different deployment scenarios
- Development without actual Yggdrasil instance
- Testing with mock configs

**Code highlights**:
```python
def read_yggdrasil_config():
    try:
        content = f.read()
        try:
            return json.loads(content)  # Try JSON
        except json.JSONDecodeError:
            return toml.loads(content)  # Fall back to TOML
    except FileNotFoundError:
        return mock_config  # Dev mode fallback
```

---

### 3. Bootstrap Implementation

**Problem**: Users need easy way to connect to the network

**Solution**: "Magic button" that:
1. Fetches community-maintained peer list
2. Filters by geography (US/Europe for low latency)
3. Randomly selects 3 peers (load distribution)
4. Deduplicates against existing peers
5. Writes config atomically
6. Reloads Yggdrasil with SIGHUP

**Why 3 peers?**
- Redundancy (if one fails, others remain)
- Not too many (avoid overwhelming the config)
- Good balance for initial connectivity

**Why US/Europe?**
- Lowest latency for most users
- Largest peer availability
- Fallback to global if regional unavailable

**Code highlights**:
```python
# Intelligent region selection
preferred_regions = ['us', 'europe', 'united states', 'germany', ...]
for country, peers in peer_data.items():
    if any(region in country.lower() for region in preferred_regions):
        available_peers.extend(peers)

# Random selection for load distribution
selected_peers = random.sample(available_peers, 3)

# Deduplication
existing_peers = set(config['Peers'])
for peer in selected_peers:
    if peer not in existing_peers:
        config['Peers'].append(peer)
```

---

### 4. QR Code Invite System

**Problem**: Manual peer URI sharing is error-prone

**Solution**: QR code generation with:
- Base64-encoded PNG in data URI format
- Standard peering string format: `tcp://[IPv6]:9001`
- Direct embedding in HTML/React without file storage

**Why QR codes?**
- Mobile-friendly (scan with camera)
- No typos or copy-paste errors
- Universal format

**Why base64 data URI?**
- No file storage needed
- Works in stateless API responses
- Direct embedding in `<img>` tags

**Code highlights**:
```python
# Generate QR code
qr = qrcode.QRCode(version=1, error_correction=ERROR_CORRECT_L)
qr.add_data(f"tcp://[{ipv6_address}]:9001")
img = qr.make_image(fill_color="black", back_color="white")

# Convert to base64 data URI
buffered = BytesIO()
img.save(buffered, format="PNG")
img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

return f'data:image/png;base64,{img_base64}'
```

---

### 5. Exit Node Configuration

**Problem**: VPN gateway setup is complex and error-prone

**Solution**: Single boolean flag that:
- Sets `TunnelRouting.Enable = true`
- Adds/removes `::/0` route advertisement
- Handles partial configurations gracefully
- Automatically disables if no routes remain

**Why `::/0`?**
- IPv6 default route (all traffic)
- Standard notation in routing protocols
- Yggdrasil's expected format

**Safety considerations**:
- Only modifies IPv6Destinations (not Sources)
- Preserves other routes when disabling
- Atomic config write + reload

**Code highlights**:
```python
if enabled:
    tunnel_routing['Enable'] = True
    if '::/0' not in tunnel_routing['IPv6Destinations']:
        tunnel_routing['IPv6Destinations'].append('::/0')
else:
    if '::/0' in tunnel_routing['IPv6Destinations']:
        tunnel_routing['IPv6Destinations'].remove('::/0')
    
    # Auto-disable if no other routes
    if not any([IPv6Destinations, IPv6Sources, IPv4Destinations, IPv4Sources]):
        tunnel_routing['Enable'] = False
```

---

### 6. Yggdrasil Reload Strategy

**Problem**: Config changes require process reload

**Solution**: SIGHUP signal with multiple detection methods
1. Try `pidof yggdrasil` (fast, reliable)
2. Fall back to `ps aux | grep yggdrasil` (compatible)
3. Return success/failure status to caller

**Why SIGHUP?**
- Standard Unix signal for config reload
- Doesn't kill the process
- Yggdrasil explicitly supports it
- No downtime

**Why multiple methods?**
- `pidof` not available on all systems
- `ps` is POSIX-standard (universal)
- Robustness across deployments

**Code highlights**:
```python
def reload_yggdrasil():
    try:
        # Method 1: pidof (fast)
        result = subprocess.run(['pidof', 'yggdrasil'], capture_output=True)
        if result.returncode == 0:
            pid = result.stdout.strip().split()[0]
            subprocess.run(['kill', '-HUP', pid])
            return True
        
        # Method 2: ps + grep (fallback)
        result = subprocess.run(['ps', 'aux'], capture_output=True)
        for line in result.stdout.split('\n'):
            if 'yggdrasil' in line.lower():
                pid = line.split()[1]
                subprocess.run(['kill', '-HUP', pid])
                return True
    except Exception:
        return False
```

---

## Error Handling Strategy

### Layered Approach

1. **Socket Level**: ConnectionError for socket issues
2. **Protocol Level**: ValueError for JSON/RPC errors
3. **Application Level**: RuntimeError for unexpected issues
4. **HTTP Level**: Appropriate status codes (503, 500, 400)

### Example Flow

```
User Request
    ↓
Flask Endpoint (try/except)
    ↓
YggdrasilSocket.send_command()
    ↓ (raises ConnectionError)
Flask Endpoint (catch)
    ↓
Return 503 + {"error": "..."}
```

### Why This Matters

- **Client gets actionable errors**: "Socket not found" vs generic "Error"
- **Debugging is easier**: Stack traces show exact failure point
- **Status codes are semantic**: 503 = service down, 500 = our bug

---

## Testing Philosophy

### Unit Tests Cover

1. **YggdrasilSocket**: Mock socket connections
2. **Config Management**: Temporary file handling
3. **API Endpoints**: Flask test client with mocks

### Why Mocking?

- Tests run without Yggdrasil installed
- Faster execution (no actual socket I/O)
- Predictable results (no network variability)

### Manual Testing Script

`test_app.py` can run without pytest:
```bash
python test_app.py
```

Benefits:
- No extra dependencies
- Works in minimal environments
- Good for CI/CD pipelines

---

## Security Considerations

### 1. Socket Access Control

**Risk**: Admin socket has full Yggdrasil control

**Mitigations**:
- Docker volume mount with `:ro` (read-only) where possible
- File permissions on socket (0660 or 0600)
- Container runs as non-root user (future enhancement)

### 2. Config File Writes

**Risk**: Writing to `/etc/yggdrasil/` requires privileges

**Mitigations**:
- Atomic writes (write to temp, then move)
- Validate config before writing
- Backup before modification (TODO)

### 3. Exit Node Liability

**Risk**: Legal/ISP issues from routing others' traffic

**Mitigations**:
- Clear UI warnings before enabling
- Documentation of risks
- Easy disable button
- Consider rate limiting (future)

### 4. Public Peer Trust

**Risk**: Automatically added peers are third parties

**Mitigations**:
- Use community-vetted peer list
- Random selection (no single point of trust)
- Users can manually review/remove peers

---

## Performance Optimizations

### Current

- Socket timeout: 5 seconds
- Bootstrap peer count: 3 (balance redundancy/overhead)
- QR code size: Minimal (version=1, error_correct_L)

### Future Enhancements

- [ ] Connection pooling for socket
- [ ] Async endpoint execution (gevent/asyncio)
- [ ] Caching for `/api/self` (TTL: 60s)
- [ ] Rate limiting on public peer fetch
- [ ] WebSocket for real-time updates

---

## Deployment Considerations

### Docker (Recommended)

- Multi-stage build reduces image size
- Volume mounts for socket and config
- Automatic restart policies
- Health checks via `/api/status`

### Standalone

- Requires Python 3.11+
- Needs access to `/var/run/yggdrasil/yggdrasil.sock`
- Systemd service recommended for production

### Production Checklist

- [ ] Use Gunicorn instead of Flask dev server
- [ ] Enable HTTPS (nginx reverse proxy)
- [ ] Set appropriate file permissions
- [ ] Configure firewall rules
- [ ] Monitor logs for errors
- [ ] Set up health check monitoring

---

## Known Limitations

1. **Config Format**: Only JSON/TOML supported (not HJSON)
2. **IPv4**: Exit node only handles IPv6 routes
3. **Peer Selection**: Geographic filtering is basic (country name matching)
4. **Reload**: Requires `kill` permission in container
5. **Backup**: No automatic config backup before modification

---

## Future Roadmap

### Phase 1 (Current)
- [x] Socket communication
- [x] Basic API endpoints
- [x] Bootstrap functionality
- [x] QR code generation
- [x] Exit node toggle

### Phase 2 (Next)
- [ ] WebSocket real-time updates
- [ ] Peer blacklist/whitelist
- [ ] Bandwidth statistics
- [ ] Config backup/restore
- [ ] Multi-node management

### Phase 3 (Future)
- [ ] Prometheus metrics export
- [ ] Advanced peer selection (latency-based)
- [ ] IPv4 exit node support
- [ ] Automatic peer health checks
- [ ] Network topology mapping

---

## Lessons Learned

### What Worked Well

1. **Mock configs for testing**: Enabled development without Yggdrasil
2. **Multi-format parser**: Handled real-world config variations
3. **Base64 QR codes**: Stateless API design
4. **Random peer selection**: Good load distribution

### What Could Be Improved

1. **HJSON support**: Some users prefer HJSON configs
2. **Config validation**: Should validate before writing
3. **Async operations**: Bootstrap can be slow on slow networks
4. **Backup mechanism**: Should backup before modifying config

### If I Started Over

1. Use `asyncio` from the start for better scalability
2. Implement proper config schema validation (jsonschema)
3. Add structured logging from day one
4. Consider gRPC instead of REST for socket communication

---

## Contributing

When adding new features:

1. **Add tests first** (TDD approach)
2. **Update API.md** with new endpoints
3. **Handle errors gracefully** (try/except + proper status codes)
4. **Document in code** (docstrings for all functions)
5. **Update README** (feature list + usage examples)

---

## Support

For issues or questions:

1. Check `backend/API.md` for endpoint documentation
2. Check `backend/README.md` for setup instructions
3. Run `python test_app.py` to verify installation
4. Check logs: `docker-compose logs -f app`

---

**Version**: 0.2.0  
**Last Updated**: 2026-01-03  
**Author**: Python Backend Architect via Shakespeare AI

---

**Vibed with [Shakespeare](https://shakespeare.diy)**
