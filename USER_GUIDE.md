# Yggdrasil Commander - User Guide

Welcome to Yggdrasil Commander! This guide will help you get started with your sovereign mesh network.

---

## 🚀 Quick Start

### 1. Start Yggdrasil Commander

```bash
docker-compose up --build
```

Visit: **http://localhost**

### 2. First-Run Experience

When you first open Yggdrasil Commander, you'll see a beautiful welcome wizard:

**"Welcome to Yggdrasil"**

You have two options:

#### Option A: Connect to Public Mesh (Recommended)
- Click the green **"Connect to Public Mesh"** button
- The system will automatically:
  - Fetch community-maintained peer list
  - Select 3 low-latency peers (US/Europe)
  - Add them to your configuration
  - Reload Yggdrasil
- **Confetti celebration!** 🎉
- You're now online!

#### Option B: I Have a Private Peer
- Click **"I Have a Private Peer"**
- Paste the peering URI (e.g., `tcp://[200:1234::1]:9001`)
- Click "Add Peer"
- *(Note: Manual peer addition endpoint coming soon)*

---

## 📊 Dashboard

The Dashboard is your command center for monitoring your Yggdrasil node.

### Connection Status Hero

**Online**
- Green gradient background
- Pulsating white indicator
- Shows: "Connected to X peers"
- Displays your IPv6 address

**Offline**
- Gray gradient background
- Shows: "Not connected to the mesh"
- Automatically triggers the First-Run Wizard

### Stats Cards

1. **Node Status**
   - Active/Inactive indicator
   - Shows network coordinates

2. **Connected Peers**
   - Total count of active connections
   - Updates every 2 seconds

3. **Public Key**
   - Your node's unique identifier
   - First 32 characters shown

### Action Buttons

**Share Invite**
- Generates a QR code for others to peer with you
- Copy-to-clipboard peering URI
- Shows your node address
- Perfect for mobile devices

**Add Peer**
- Manually add a peer by URI
- *(Coming soon)*

### Active Peers List

Real-time list of connected peers showing:
- IPv6 address
- Port number
- Connection uptime
- Active status indicator

---

## 👥 Peers Page

Comprehensive peer management interface.

### Overview Stats

- **Total Peers**: Number of configured peers
- **Active Connections**: Currently connected peers
- **Avg Uptime**: Average connection duration

### Peer Table

Detailed table with sortable columns:

| Column | Description |
|--------|-------------|
| Address | IPv6 address and public key |
| Port | Connection port |
| Uptime | How long the connection has been active |
| Traffic | Bytes sent ↑ and received ↓ |
| Status | Active indicator (pulsating green dot) |
| Actions | Remove peer (coming soon) |

### Add Peer Button

Click to add a new peer manually (functionality coming soon).

---

## ⚙️ Settings Page

Configure your Yggdrasil node.

### Exit Node (VPN Gateway)

**What it does**: Allows other mesh devices to route their internet traffic through your node.

**How to enable**:
1. Go to Settings
2. Find "Exit Node (VPN Gateway)" card
3. Click the toggle switch (turns green when enabled)
4. Read the warning carefully

**Important Warnings** ⚠️
- Your IP address will be visible to other mesh users
- You may be liable for traffic routed through your connection
- Check your ISP's terms of service before enabling
- Monitor your bandwidth usage regularly

**When enabled**:
- Your node advertises `::/0` (all IPv6 traffic)
- Other nodes can configure routing through you
- Status shows "Advertising ::/0 to the mesh"

**When disabled**:
- No routes are advertised
- Status shows "Not advertising any routes"

**Optimistic UI**: The toggle updates immediately, then syncs with the backend. If the API call fails, it reverts automatically.

---

## 🔄 Real-Time Updates

All data updates automatically every **2 seconds**:
- Node status
- Peer list
- Connection statistics
- Traffic counters

**Last Update Indicator**: Shows the time of the most recent refresh in the top-right corner of each page.

---

## 📱 Share Your Node

### Generate an Invite

1. Click **"Share Invite"** on the Dashboard
2. A modal opens with:
   - QR code (scan with mobile)
   - Peering URI (copy-to-clipboard)
   - Your node address

### Sharing Options

**QR Code**: Perfect for in-person sharing
- Open the invite modal on your computer
- Have the other person scan with their mobile device
- They can paste the URI into their Yggdrasil config

**Copy-Paste**: For remote sharing
- Click the copy icon next to the peering URI
- Share via Signal, email, or encrypted chat
- They add it to their peers list

---

## 🛡️ Security Best Practices

### General

1. **Peer Verification**: Only connect to trusted peers when possible
2. **Regular Updates**: Keep Yggdrasil Commander up to date
3. **Monitor Traffic**: Watch for unusual bandwidth patterns
4. **Firewall**: Configure your firewall appropriately

### Exit Node Specific

1. **Legal Check**: Verify your ISP allows traffic forwarding
2. **Liability**: Understand you're responsible for routed traffic
3. **Bandwidth**: Monitor usage to avoid exceeding limits
4. **Logging**: Consider traffic logging for accountability

### Privacy

1. **No Central Accounts**: Your node is completely sovereign
2. **No Tracking**: No analytics or telemetry sent to any server
3. **Local Only**: All data stored in Docker volumes on your machine

---

## 🎨 Design Philosophy

**Sovereign Simplicity** guides every interaction:

- **Clean**: No clutter, only essential information
- **Minimal**: Apple-inspired aesthetics
- **Sovereign**: No external dependencies or accounts
- **Trustworthy**: Clear warnings and transparent actions

**Color Palette**:
- Slate grays for backgrounds and text
- Emerald-500 for active states only
- Red for errors and warnings
- No unnecessary colors

---

## 🔧 Troubleshooting

### "Offline" Status Won't Change

**Problem**: Dashboard shows offline even after bootstrap

**Solutions**:
1. Wait 5-10 seconds for peers to connect
2. Refresh the page (`Ctrl+R` or `Cmd+R`)
3. Check Yggdrasil logs: `docker-compose logs yggdrasil`
4. Try bootstrap again

### QR Code Doesn't Load

**Problem**: Invite modal shows loading spinner indefinitely

**Solutions**:
1. Check that Yggdrasil socket is responsive
2. View backend logs: `docker-compose logs app`
3. Verify `/api/invite` returns data: `curl http://localhost/api/invite`

### Exit Node Toggle Reverts

**Problem**: Toggle switches on but immediately switches back off

**Solutions**:
1. Check error message at top of Settings page
2. Verify config file permissions
3. Check backend logs for write errors
4. Try manual config edit

### Peers Not Connecting

**Problem**: Bootstrap adds peers but none connect

**Solutions**:
1. Check your firewall allows outbound connections on port 9001
2. Verify Docker host networking is working
3. Try different public peers
4. Check Yggdrasil logs for connection errors

---

## 📖 Common Tasks

### Add Public Peers
1. Dashboard → Click "Get Started" (if offline)
2. Or: Settings → (future: Bootstrap button)
3. Click "Connect to Public Mesh"
4. Wait for confetti 🎉

### Share Your Node
1. Dashboard → Click "Share Invite"
2. QR code appears
3. Have peer scan or copy URI
4. Close modal when done

### Enable VPN Gateway
1. Settings → Find "Exit Node" card
2. Read the warnings
3. Toggle switch to enable
4. Monitor the status

### Monitor Peer Health
1. Go to Peers page
2. View the peer table
3. Check uptime and traffic
4. Look for active indicators

### Check Node Status
1. Dashboard shows real-time status
2. Green = Online, Gray = Offline
3. View coordinates and key
4. Monitor peer count

---

## 🌐 Network Topology

### Understanding Your Position

**Coordinates**: `[1 2 3]` format
- Each number represents a hop in the tree
- Lower numbers = closer to the root
- Changes as you add/remove peers

**Address**: `200:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx`
- Your unique IPv6 address on the mesh
- Derived from your public key
- Permanent for your node

**Subnet**: `300:xxxx:xxxx:xxxx::/64`
- Your routable subnet
- Can assign addresses to devices
- Useful for routing to local network

---

## 💡 Tips & Tricks

### Optimal Peer Count
- **3-5 peers**: Good balance
- **Too few** (<2): No redundancy
- **Too many** (>10): Overhead without benefit

### Low-Latency Connections
- Bootstrap auto-selects US/Europe peers
- Add manual peers in your region for best performance
- Monitor uptime to find reliable peers

### Privacy Considerations
- Public peers can see your IP
- Use private peers when possible
- Consider VPN for additional privacy layer

### Performance
- Dashboard updates every 2 seconds
- Disable browser extensions if slow
- Use modern browser (Chrome, Firefox, Safari)

---

## 🆘 Getting Help

### Check Documentation
1. This User Guide
2. DEVELOPMENT.md (developer guide)
3. backend/API.md (API reference)
4. frontend/README.md (frontend guide)

### Check Logs
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f app
docker-compose logs -f yggdrasil
```

### Check API Health
```bash
# Backend status
curl http://localhost/api/status

# Node info
curl http://localhost/api/self

# Peer list
curl http://localhost/api/peers
```

### Community Resources
- Yggdrasil Matrix: `#yggdrasil:matrix.org`
- GitHub Issues: (your repository)

---

## 📚 Additional Reading

- [Yggdrasil Official Docs](https://yggdrasil-network.github.io/)
- [Understanding Mesh Networks](https://en.wikipedia.org/wiki/Mesh_networking)
- [IPv6 Basics](https://en.wikipedia.org/wiki/IPv6)

---

## 🎯 Next Steps

After getting comfortable with the basics:

1. **Invite Friends**: Share your QR code
2. **Build Your Network**: Add trusted private peers
3. **Explore Exit Nodes**: Help others with secure routing
4. **Monitor Performance**: Track bandwidth and uptime
5. **Contribute**: Report bugs, suggest features

---

**Welcome to the sovereign mesh! 🌳**

---

**Vibed with [Shakespeare](https://shakespeare.diy)**
