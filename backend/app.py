#!/usr/bin/env python3
"""
Yggdrasil Commander - Backend API Server
Zero-config appliance for sovereign network management.
"""

import os
import json
import socket
import base64
import random
import subprocess
from io import BytesIO
from pathlib import Path
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import qrcode
import requests
import toml

app = Flask(__name__, static_folder=None)
CORS(app)

# Configuration
FRONTEND_BUILD_DIR = Path(__file__).parent.parent / 'frontend' / 'out'
YGGDRASIL_SOCKET = os.environ.get('YGGDRASIL_SOCKET', '/var/run/yggdrasil/yggdrasil.sock')
YGGDRASIL_CONFIG = '/etc/yggdrasil/yggdrasil.conf'
PUBLIC_PEERS_URL = 'https://publicpeers.neilalexander.dev/publicnodes.json'


class YggdrasilSocket:
    """
    Helper class for communicating with Yggdrasil admin socket via JSON-RPC.
    """
    
    def __init__(self, socket_path=YGGDRASIL_SOCKET):
        self.socket_path = socket_path
    
    def send_command(self, method, params=None):
        """
        Send a JSON-RPC request to the Yggdrasil admin socket.
        
        Args:
            method (str): The RPC method to call (e.g., 'getSelf', 'getPeers')
            params (dict): Optional parameters for the method
        
        Returns:
            dict: The JSON-RPC response
        
        Raises:
            ConnectionError: If unable to connect to the socket
            ValueError: If the response is invalid JSON
        """
        if not os.path.exists(self.socket_path):
            raise ConnectionError(f"Yggdrasil socket not found at {self.socket_path}")
        
        # Construct JSON-RPC request
        request_obj = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method
        }
        if params:
            request_obj["params"] = params
        
        request_json = json.dumps(request_obj)
        
        try:
            # Connect to Unix socket
            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            sock.settimeout(5)  # 5 second timeout
            sock.connect(self.socket_path)
            
            # Send request
            sock.sendall(request_json.encode('utf-8'))
            sock.sendall(b'\n')  # Yggdrasil expects newline-delimited JSON
            
            # Receive response
            response_data = b''
            while True:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                response_data += chunk
                # Check if we have a complete JSON object
                try:
                    json.loads(response_data.decode('utf-8'))
                    break
                except json.JSONDecodeError:
                    continue
            
            sock.close()
            
            # Parse response
            response = json.loads(response_data.decode('utf-8'))
            
            # Check for JSON-RPC errors
            if 'error' in response:
                raise ValueError(f"RPC Error: {response['error']}")
            
            return response.get('result', response)
        
        except socket.timeout:
            raise ConnectionError(f"Timeout connecting to {self.socket_path}")
        except socket.error as e:
            raise ConnectionError(f"Socket error: {e}")
        except Exception as e:
            raise RuntimeError(f"Unexpected error: {e}")


def check_yggdrasil_socket():
    """Check if the Yggdrasil admin socket is accessible."""
    try:
        return os.path.exists(YGGDRASIL_SOCKET)
    except Exception:
        return False


def reload_yggdrasil():
    """
    Reload Yggdrasil configuration by sending SIGHUP to the process.
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get Yggdrasil PID
        result = subprocess.run(
            ['pidof', 'yggdrasil'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode != 0 or not result.stdout.strip():
            # Try alternative method: ps + grep
            result = subprocess.run(
                ['ps', 'aux'],
                capture_output=True,
                text=True,
                timeout=5
            )
            for line in result.stdout.split('\n'):
                if 'yggdrasil' in line.lower() and 'grep' not in line:
                    pid = line.split()[1]
                    subprocess.run(['kill', '-HUP', pid], timeout=5)
                    return True
            return False
        
        pid = result.stdout.strip().split()[0]
        subprocess.run(['kill', '-HUP', pid], timeout=5)
        return True
    
    except subprocess.TimeoutExpired:
        return False
    except Exception as e:
        print(f"Error reloading Yggdrasil: {e}")
        return False


def read_yggdrasil_config():
    """
    Read Yggdrasil configuration file.
    
    Returns:
        dict: Configuration object
    """
    try:
        with open(YGGDRASIL_CONFIG, 'r') as f:
            # Yggdrasil uses HJSON, which is mostly compatible with TOML
            # For robustness, try multiple parsers
            content = f.read()
            
            # Try parsing as JSON first (if it's valid JSON)
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                pass
            
            # Try TOML parser
            try:
                return toml.loads(content)
            except:
                pass
            
            # Fallback: create a minimal config structure
            return {
                'Peers': [],
                'TunnelRouting': {
                    'Enable': False,
                    'IPv6Sources': [],
                    'IPv6Destinations': [],
                    'IPv4Sources': [],
                    'IPv4Destinations': []
                }
            }
    
    except FileNotFoundError:
        # Create mock config for testing/development
        return {
            'Peers': [],
            'TunnelRouting': {
                'Enable': False,
                'IPv6Sources': [],
                'IPv6Destinations': [],
                'IPv4Sources': [],
                'IPv4Destinations': []
            }
        }


def write_yggdrasil_config(config):
    """
    Write Yggdrasil configuration file.
    
    Args:
        config (dict): Configuration object
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Ensure parent directory exists
        os.makedirs(os.path.dirname(YGGDRASIL_CONFIG), exist_ok=True)
        
        # Write as JSON (Yggdrasil accepts JSON)
        with open(YGGDRASIL_CONFIG, 'w') as f:
            json.dump(config, f, indent=2)
        
        return True
    
    except Exception as e:
        print(f"Error writing config: {e}")
        return False


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.route('/api/status')
def api_status():
    """
    Health check endpoint that reports backend and Yggdrasil socket status.
    """
    socket_exists = check_yggdrasil_socket()
    
    # Try to ping Yggdrasil socket
    socket_responsive = False
    if socket_exists:
        try:
            ygg = YggdrasilSocket()
            ygg.send_command('getSelf')
            socket_responsive = True
        except:
            pass
    
    return jsonify({
        'status': 'ok',
        'yggdrasil_socket': 'connected' if socket_responsive else 'disconnected',
        'socket_path': YGGDRASIL_SOCKET,
        'socket_exists': socket_exists,
        'socket_responsive': socket_responsive,
        'backend_version': '0.2.0'
    })


@app.route('/api/self')
def api_self():
    """
    Get information about this Yggdrasil node.
    
    Returns:
        JSON with address, key, and coords
    """
    try:
        ygg = YggdrasilSocket()
        result = ygg.send_command('getSelf')
        
        # Extract clean data
        return jsonify({
            'address': result.get('address', 'N/A'),
            'key': result.get('key', 'N/A'),
            'coords': result.get('coords', 'N/A'),
            'subnet': result.get('subnet', 'N/A')
        })
    
    except ConnectionError as e:
        return jsonify({'error': str(e)}), 503
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/peers')
def api_peers():
    """
    Get list of connected peers.
    
    Returns:
        JSON with list of peers
    """
    try:
        ygg = YggdrasilSocket()
        result = ygg.send_command('getPeers')
        
        return jsonify({
            'peers': result.get('peers', [])
        })
    
    except ConnectionError as e:
        return jsonify({'error': str(e)}), 503
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/invite')
def api_invite():
    """
    Generate an invite QR code for peers to connect to this node.
    
    The QR code contains the peering string: tcp://[<IPv6>]:9001
    
    Returns:
        JSON with base64-encoded QR code image
    """
    try:
        ygg = YggdrasilSocket()
        result = ygg.send_command('getSelf')
        
        ipv6_address = result.get('address', '')
        if not ipv6_address:
            return jsonify({'error': 'Could not retrieve IPv6 address'}), 500
        
        # Construct peering string (assume port 9001 for TCP)
        peering_string = f"tcp://[{ipv6_address}]:9001"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(peering_string)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return jsonify({
            'qr_code': f'data:image/png;base64,{img_base64}',
            'peering_string': peering_string,
            'address': ipv6_address
        })
    
    except ConnectionError as e:
        return jsonify({'error': str(e)}), 503
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/bootstrap', methods=['POST'])
def api_bootstrap():
    """
    Bootstrap the node by automatically adding public peers.
    
    This is the "magic button" that:
    1. Fetches public peer list
    2. Selects 3 peers from US or Europe
    3. Adds them to the config
    4. Reloads Yggdrasil
    
    Returns:
        JSON with status and list of added peers
    """
    try:
        # Step A: Fetch public peer list
        response = requests.get(PUBLIC_PEERS_URL, timeout=10)
        response.raise_for_status()
        peer_data = response.json()
        
        # Step B: Select peers from US or Europe
        preferred_regions = ['us', 'europe', 'united states', 'germany', 'france', 'uk', 'netherlands']
        selected_peers = []
        
        # Flatten peer list and filter by region
        available_peers = []
        for country, peers in peer_data.items():
            country_lower = country.lower()
            if any(region in country_lower for region in preferred_regions):
                for peer in peers:
                    if isinstance(peer, str):
                        available_peers.append(peer)
        
        # If no regional peers found, use any available
        if not available_peers:
            for country, peers in peer_data.items():
                for peer in peers:
                    if isinstance(peer, str):
                        available_peers.append(peer)
        
        # Randomly select 3 peers
        if len(available_peers) >= 3:
            selected_peers = random.sample(available_peers, 3)
        elif available_peers:
            selected_peers = available_peers
        else:
            return jsonify({'error': 'No public peers available'}), 500
        
        # Step C: Read current config
        config = read_yggdrasil_config()
        
        # Ensure Peers list exists
        if 'Peers' not in config:
            config['Peers'] = []
        
        # Step D: Append new peers (avoid duplicates)
        existing_peers = set(config['Peers'])
        peers_added = []
        
        for peer in selected_peers:
            if peer not in existing_peers:
                config['Peers'].append(peer)
                peers_added.append(peer)
        
        # Step E: Write config back
        if not write_yggdrasil_config(config):
            return jsonify({'error': 'Failed to write configuration'}), 500
        
        # Step F: Reload Yggdrasil
        reload_success = reload_yggdrasil()
        
        return jsonify({
            'status': 'bootstrapped',
            'peers_added': peers_added,
            'total_peers': len(config['Peers']),
            'reload_success': reload_success
        })
    
    except requests.RequestException as e:
        return jsonify({'error': f'Failed to fetch public peers: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/api/exit-node', methods=['POST'])
def api_exit_node():
    """
    Enable or disable exit node functionality.
    
    Request body:
        { "enabled": true/false }
    
    When enabled:
        - Sets TunnelRouting.Enable = true
        - Adds "::/0" to IPv6Destinations (route all traffic)
    
    When disabled:
        - Removes "::/0" from IPv6Destinations
        - Sets TunnelRouting.Enable = false if no other routes
    
    Returns:
        JSON with status
    """
    try:
        data = request.get_json()
        enabled = data.get('enabled', False)
        
        # Read current config
        config = read_yggdrasil_config()
        
        # Ensure TunnelRouting structure exists
        if 'TunnelRouting' not in config:
            config['TunnelRouting'] = {
                'Enable': False,
                'IPv6Sources': [],
                'IPv6Destinations': [],
                'IPv4Sources': [],
                'IPv4Destinations': []
            }
        
        tunnel_routing = config['TunnelRouting']
        
        # Ensure IPv6Destinations exists
        if 'IPv6Destinations' not in tunnel_routing:
            tunnel_routing['IPv6Destinations'] = []
        
        if enabled:
            # Enable exit node
            tunnel_routing['Enable'] = True
            
            # Add ::/0 to advertised routes (if not already present)
            if '::/0' not in tunnel_routing['IPv6Destinations']:
                tunnel_routing['IPv6Destinations'].append('::/0')
        
        else:
            # Disable exit node
            # Remove ::/0 from advertised routes
            if '::/0' in tunnel_routing['IPv6Destinations']:
                tunnel_routing['IPv6Destinations'].remove('::/0')
            
            # Disable TunnelRouting if no other routes
            has_routes = (
                tunnel_routing.get('IPv6Destinations', []) or
                tunnel_routing.get('IPv6Sources', []) or
                tunnel_routing.get('IPv4Destinations', []) or
                tunnel_routing.get('IPv4Sources', [])
            )
            
            if not has_routes:
                tunnel_routing['Enable'] = False
        
        # Write config back
        if not write_yggdrasil_config(config):
            return jsonify({'error': 'Failed to write configuration'}), 500
        
        # Reload Yggdrasil
        reload_success = reload_yggdrasil()
        
        return jsonify({
            'status': 'exit_node_updated',
            'enabled': enabled,
            'advertised_routes': tunnel_routing.get('IPv6Destinations', []),
            'reload_success': reload_success
        })
    
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


# =============================================================================
# STATIC FILE SERVING (Next.js Frontend)
# =============================================================================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """
    Serve the Next.js static build.
    Handles both direct file requests and client-side routing.
    """
    if path and (FRONTEND_BUILD_DIR / path).exists():
        return send_from_directory(FRONTEND_BUILD_DIR, path)
    elif path and (FRONTEND_BUILD_DIR / f'{path}.html').exists():
        return send_from_directory(FRONTEND_BUILD_DIR, f'{path}.html')
    else:
        # Fallback to index.html for client-side routing
        return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')


if __name__ == '__main__':
    # Ensure frontend build exists
    if not FRONTEND_BUILD_DIR.exists():
        print(f"Warning: Frontend build directory not found at {FRONTEND_BUILD_DIR}")
        print("Please build the frontend first with: cd frontend && npm run build")
    
    print("🌳 Yggdrasil Commander Backend")
    print(f"📁 Frontend: {FRONTEND_BUILD_DIR}")
    print(f"🔌 Socket: {YGGDRASIL_SOCKET}")
    print(f"⚙️  Config: {YGGDRASIL_CONFIG}")
    print(f"🌐 Starting on http://0.0.0.0:5000")
    
    # Run the Flask development server
    # In production, use a WSGI server like Gunicorn
    app.run(host='0.0.0.0', port=5000, debug=False)
