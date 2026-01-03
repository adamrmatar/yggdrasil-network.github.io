# Yggdrasil Commander - API Documentation

## Overview

The Yggdrasil Commander backend provides a RESTful API for managing Yggdrasil network nodes. All endpoints return JSON responses.

**Base URL**: `http://localhost:5000/api`

---

## Endpoints

### 1. Health Check

**GET** `/api/status`

Check the health of the backend and Yggdrasil connection.

**Response:**
```json
{
  "status": "ok",
  "yggdrasil_socket": "connected",
  "socket_path": "/var/run/yggdrasil/yggdrasil.sock",
  "socket_exists": true,
  "socket_responsive": true,
  "backend_version": "0.2.0"
}
```

**Status Codes:**
- `200 OK` - Backend is healthy

---

### 2. Get Node Information

**GET** `/api/self`

Retrieve information about the local Yggdrasil node.

**Response:**
```json
{
  "address": "200:1234:5678:90ab:cdef:1234:5678:90ab",
  "key": "a1b2c3d4e5f6...",
  "coords": "[1 2 3 4]",
  "subnet": "300:1234:5678:90ab::/64"
}
```

**Status Codes:**
- `200 OK` - Successfully retrieved node info
- `503 Service Unavailable` - Cannot connect to Yggdrasil socket

**Error Response:**
```json
{
  "error": "Yggdrasil socket not found at /var/run/yggdrasil/yggdrasil.sock"
}
```

---

### 3. Get Connected Peers

**GET** `/api/peers`

Retrieve list of currently connected peers.

**Response:**
```json
{
  "peers": [
    {
      "address": "200:abcd::1",
      "key": "peer_key_123",
      "port": 12345,
      "uptime": 3600
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Successfully retrieved peers
- `503 Service Unavailable` - Cannot connect to Yggdrasil socket

---

### 4. Generate Invite QR Code

**GET** `/api/invite`

Generate a QR code that other nodes can scan to peer with this node.

**Response:**
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "peering_string": "tcp://[200:1234::1]:9001",
  "address": "200:1234::1"
}
```

**Fields:**
- `qr_code` - Base64-encoded PNG image (data URI)
- `peering_string` - Plain text peering URI
- `address` - Node's IPv6 address

**Status Codes:**
- `200 OK` - QR code generated successfully
- `503 Service Unavailable` - Cannot connect to Yggdrasil socket
- `500 Internal Server Error` - Failed to generate QR code

**Usage Example (HTML):**
```html
<img src="{{ qr_code }}" alt="Peering QR Code" />
```

---

### 5. Bootstrap with Public Peers (Magic Button)

**POST** `/api/bootstrap`

Automatically add public peers to the configuration and reload Yggdrasil.

This endpoint:
1. Fetches public peer list from `https://publicpeers.neilalexander.dev/publicnodes.json`
2. Selects 3 random peers from US or Europe (low latency regions)
3. Adds them to `yggdrasil.conf`
4. Reloads Yggdrasil configuration

**Request:**
```
POST /api/bootstrap
Content-Type: application/json
```

**Response:**
```json
{
  "status": "bootstrapped",
  "peers_added": [
    "tcp://peer1.us:9001",
    "tcp://peer2.de:9001",
    "tcp://peer3.eu:9001"
  ],
  "total_peers": 5,
  "reload_success": true
}
```

**Fields:**
- `status` - Always "bootstrapped" on success
- `peers_added` - List of newly added peer URIs
- `total_peers` - Total number of peers after bootstrap
- `reload_success` - Whether Yggdrasil was successfully reloaded

**Status Codes:**
- `200 OK` - Bootstrap completed successfully
- `500 Internal Server Error` - Failed to fetch peers or write config

**Error Response:**
```json
{
  "error": "Failed to fetch public peers: Connection timeout"
}
```

**Notes:**
- Duplicate peers are automatically filtered
- If less than 3 peers are available, all available peers are added
- Configuration is backed up before modification (TODO)

---

### 6. Enable/Disable Exit Node

**POST** `/api/exit-node`

Configure this node as an exit node (VPN gateway) for other Yggdrasil nodes.

**Request:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "status": "exit_node_updated",
  "enabled": true,
  "advertised_routes": ["::/0"],
  "reload_success": true
}
```

**Fields:**
- `status` - Always "exit_node_updated" on success
- `enabled` - Current exit node status
- `advertised_routes` - List of routes being advertised (`::/0` = all traffic)
- `reload_success` - Whether Yggdrasil was successfully reloaded

**Status Codes:**
- `200 OK` - Exit node configuration updated
- `500 Internal Server Error` - Failed to write config or reload

**Behavior:**

**When `enabled: true`:**
- Sets `TunnelRouting.Enable = true`
- Adds `::/0` to `TunnelRouting.IPv6Destinations`
- Other nodes can route all traffic through this node

**When `enabled: false`:**
- Removes `::/0` from `TunnelRouting.IPv6Destinations`
- Sets `TunnelRouting.Enable = false` if no other routes exist

**Security Warning:**
Running an exit node means other nodes can route traffic through your connection. Ensure:
- You have permission from your ISP
- Your firewall is properly configured
- You understand the legal implications

---

## Error Handling

All endpoints use consistent error responses:

```json
{
  "error": "Description of what went wrong"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Request successful
- `400 Bad Request` - Invalid request payload
- `500 Internal Server Error` - Server-side error
- `503 Service Unavailable` - Yggdrasil socket not accessible

---

## YggdrasilSocket Class

Internal helper class for JSON-RPC communication with Yggdrasil.

### Methods

#### `send_command(method, params=None)`

Send a JSON-RPC request to Yggdrasil admin socket.

**Parameters:**
- `method` (str) - RPC method name (e.g., 'getSelf', 'getPeers', 'addPeer')
- `params` (dict, optional) - Method parameters

**Returns:**
- `dict` - JSON-RPC result

**Raises:**
- `ConnectionError` - Socket not found or connection failed
- `ValueError` - Invalid JSON response or RPC error
- `RuntimeError` - Unexpected error

**Example:**
```python
from app import YggdrasilSocket

ygg = YggdrasilSocket()
result = ygg.send_command('getSelf')
print(result['address'])  # 200:1234::1
```

---

## Configuration Management

### `read_yggdrasil_config()`

Read and parse Yggdrasil configuration file.

**Returns:**
- `dict` - Configuration object

**Fallback Behavior:**
- If file doesn't exist, returns default mock config
- Tries JSON parser first, then TOML
- Always returns a valid dict structure

### `write_yggdrasil_config(config)`

Write configuration to `/etc/yggdrasil/yggdrasil.conf`.

**Parameters:**
- `config` (dict) - Configuration object

**Returns:**
- `bool` - True if successful, False otherwise

### `reload_yggdrasil()`

Reload Yggdrasil by sending SIGHUP to the process.

**Returns:**
- `bool` - True if successful, False otherwise

**Methods:**
1. Uses `pidof yggdrasil` to find process ID
2. Fallback to `ps aux | grep yggdrasil`
3. Sends `kill -HUP <pid>`

---

## Development

### Running Locally

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Server will start on `http://0.0.0.0:5000`

### Running Tests

```bash
# With pytest
pip install pytest pytest-cov
pytest test_app.py -v

# Manual execution
python test_app.py
```

### Environment Variables

- `YGGDRASIL_SOCKET` - Path to admin socket (default: `/var/run/yggdrasil/yggdrasil.sock`)
- `FLASK_ENV` - Flask environment (default: `production`)

---

## Security Considerations

1. **Socket Access**: Admin socket provides full control over Yggdrasil
2. **File Permissions**: Config file writes require appropriate permissions
3. **Exit Node**: Running exit node exposes your IP to other nodes' traffic
4. **Public Peers**: Automatically added peers are trusted third parties

**Recommendations:**
- Run backend with minimal required permissions
- Use Docker volume mounts with read-only where possible
- Monitor exit node traffic if enabled
- Review public peer list before bootstrapping

---

## Future Enhancements

- [ ] Config file backup before modifications
- [ ] Peer blacklist/whitelist management
- [ ] Bandwidth statistics tracking
- [ ] WebSocket support for real-time updates
- [ ] Multi-node management API
- [ ] Authentication/authorization layer

---

**Version**: 0.2.0  
**Last Updated**: 2026-01-03

---

**Vibed with [Shakespeare](https://shakespeare.diy)**
