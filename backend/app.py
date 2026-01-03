#!/usr/bin/env python3
"""
Yggdrasil Commander - Backend API Server
Serves the Next.js frontend and provides API endpoints for Yggdrasil management.
"""

import os
import socket
from pathlib import Path
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder=None)
CORS(app)

# Configuration
FRONTEND_BUILD_DIR = Path(__file__).parent.parent / 'frontend' / 'out'
YGGDRASIL_SOCKET = os.environ.get('YGGDRASIL_SOCKET', '/var/run/yggdrasil/yggdrasil.sock')


def check_yggdrasil_socket():
    """Check if the Yggdrasil admin socket is accessible."""
    try:
        return os.path.exists(YGGDRASIL_SOCKET)
    except Exception:
        return False


@app.route('/api/status')
def api_status():
    """
    Health check endpoint that reports backend and Yggdrasil socket status.
    """
    socket_exists = check_yggdrasil_socket()
    
    return jsonify({
        'status': 'ok',
        'yggdrasil_socket': 'connected' if socket_exists else 'disconnected',
        'socket_path': YGGDRASIL_SOCKET,
        'backend_version': '0.1.0'
    })


@app.route('/api/node/info')
def api_node_info():
    """
    Placeholder endpoint for retrieving Yggdrasil node information.
    Will be implemented to communicate with the admin socket.
    """
    return jsonify({
        'address': 'Not yet implemented',
        'subnet': 'Not yet implemented',
        'public_key': 'Not yet implemented',
        'coords': 'Not yet implemented'
    })


# Serve Next.js static files
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
    
    # Run the Flask development server
    # In production, use a WSGI server like Gunicorn
    app.run(host='0.0.0.0', port=5000, debug=False)
