#!/usr/bin/env python3
"""
Test suite for Yggdrasil Commander backend.
Run with: python -m pytest test_app.py -v
"""

import json
import tempfile
from unittest.mock import Mock, patch, MagicMock
from app import (
    YggdrasilSocket,
    check_yggdrasil_socket,
    read_yggdrasil_config,
    write_yggdrasil_config,
    reload_yggdrasil,
    app
)


class TestYggdrasilSocket:
    """Test the YggdrasilSocket class."""
    
    def test_socket_not_found(self):
        """Test behavior when socket doesn't exist."""
        ygg = YggdrasilSocket('/nonexistent/socket.sock')
        try:
            ygg.send_command('getSelf')
            assert False, "Should raise ConnectionError"
        except ConnectionError as e:
            assert 'not found' in str(e)
    
    @patch('socket.socket')
    def test_send_command_success(self, mock_socket_class):
        """Test successful command execution."""
        # Mock socket
        mock_sock = MagicMock()
        mock_socket_class.return_value = mock_sock
        
        # Mock response
        response = {
            "jsonrpc": "2.0",
            "id": 1,
            "result": {
                "address": "200:1234::1",
                "key": "abc123",
                "coords": "[1 2 3]"
            }
        }
        mock_sock.recv.return_value = json.dumps(response).encode('utf-8')
        
        # Create temporary socket file for testing
        with tempfile.NamedTemporaryFile() as tmp:
            ygg = YggdrasilSocket(tmp.name)
            
            with patch('os.path.exists', return_value=True):
                result = ygg.send_command('getSelf')
                assert result['address'] == "200:1234::1"
    
    @patch('socket.socket')
    def test_send_command_with_params(self, mock_socket_class):
        """Test command with parameters."""
        mock_sock = MagicMock()
        mock_socket_class.return_value = mock_sock
        
        response = {"jsonrpc": "2.0", "id": 1, "result": {}}
        mock_sock.recv.return_value = json.dumps(response).encode('utf-8')
        
        with tempfile.NamedTemporaryFile() as tmp:
            ygg = YggdrasilSocket(tmp.name)
            
            with patch('os.path.exists', return_value=True):
                ygg.send_command('addPeer', {'uri': 'tcp://example.com:9001'})
                
                # Verify request was sent with params
                call_args = mock_sock.sendall.call_args_list[0][0][0]
                request = json.loads(call_args.decode('utf-8'))
                assert 'params' in request


class TestConfigManagement:
    """Test configuration file read/write operations."""
    
    def test_read_nonexistent_config(self):
        """Test reading config when file doesn't exist."""
        with patch('builtins.open', side_effect=FileNotFoundError):
            config = read_yggdrasil_config()
            assert 'Peers' in config
            assert 'TunnelRouting' in config
    
    def test_read_json_config(self):
        """Test reading valid JSON config."""
        test_config = {
            'Peers': ['tcp://peer1:9001'],
            'TunnelRouting': {'Enable': False}
        }
        
        mock_file = MagicMock()
        mock_file.__enter__().read.return_value = json.dumps(test_config)
        
        with patch('builtins.open', return_value=mock_file):
            config = read_yggdrasil_config()
            assert config['Peers'] == ['tcp://peer1:9001']
    
    def test_write_config(self):
        """Test writing config to file."""
        test_config = {
            'Peers': ['tcp://peer1:9001'],
            'TunnelRouting': {'Enable': False}
        }
        
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp:
            tmp_path = tmp.name
        
        with patch('backend.app.YGGDRASIL_CONFIG', tmp_path):
            result = write_yggdrasil_config(test_config)
            assert result is True
            
            # Verify file contents
            with open(tmp_path, 'r') as f:
                written_config = json.load(f)
                assert written_config['Peers'] == ['tcp://peer1:9001']


class TestAPIEndpoints:
    """Test Flask API endpoints."""
    
    def setup_method(self):
        """Set up test client."""
        app.config['TESTING'] = True
        self.client = app.test_client()
    
    def test_api_status(self):
        """Test /api/status endpoint."""
        response = self.client.get('/api/status')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'status' in data
        assert 'yggdrasil_socket' in data
        assert 'backend_version' in data
    
    @patch('backend.app.YggdrasilSocket')
    def test_api_self_success(self, mock_ygg_class):
        """Test /api/self endpoint with successful response."""
        mock_ygg = MagicMock()
        mock_ygg.send_command.return_value = {
            'address': '200:1234::1',
            'key': 'testkey123',
            'coords': '[1 2 3]',
            'subnet': '300:1234::/64'
        }
        mock_ygg_class.return_value = mock_ygg
        
        response = self.client.get('/api/self')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['address'] == '200:1234::1'
        assert data['key'] == 'testkey123'
    
    @patch('backend.app.YggdrasilSocket')
    def test_api_self_connection_error(self, mock_ygg_class):
        """Test /api/self endpoint with connection error."""
        mock_ygg = MagicMock()
        mock_ygg.send_command.side_effect = ConnectionError("Socket not found")
        mock_ygg_class.return_value = mock_ygg
        
        response = self.client.get('/api/self')
        assert response.status_code == 503
    
    @patch('backend.app.YggdrasilSocket')
    @patch('backend.app.qrcode.QRCode')
    def test_api_invite(self, mock_qr_class, mock_ygg_class):
        """Test /api/invite endpoint."""
        # Mock Yggdrasil socket
        mock_ygg = MagicMock()
        mock_ygg.send_command.return_value = {
            'address': '200:1234::1'
        }
        mock_ygg_class.return_value = mock_ygg
        
        # Mock QR code generation
        mock_qr = MagicMock()
        mock_img = MagicMock()
        mock_qr.make_image.return_value = mock_img
        mock_qr_class.return_value = mock_qr
        
        response = self.client.get('/api/invite')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'qr_code' in data
        assert 'peering_string' in data
        assert 'tcp://[200:1234::1]:9001' in data['peering_string']
    
    @patch('backend.app.requests.get')
    @patch('backend.app.read_yggdrasil_config')
    @patch('backend.app.write_yggdrasil_config')
    @patch('backend.app.reload_yggdrasil')
    def test_api_bootstrap(self, mock_reload, mock_write, mock_read, mock_requests_get):
        """Test /api/bootstrap endpoint."""
        # Mock public peers API
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'United States': [
                'tcp://peer1.us:9001',
                'tcp://peer2.us:9001',
                'tcp://peer3.us:9001'
            ],
            'Germany': ['tcp://peer1.de:9001']
        }
        mock_requests_get.return_value = mock_response
        
        # Mock config
        mock_read.return_value = {'Peers': []}
        mock_write.return_value = True
        mock_reload.return_value = True
        
        response = self.client.post('/api/bootstrap')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['status'] == 'bootstrapped'
        assert len(data['peers_added']) <= 3
    
    @patch('backend.app.read_yggdrasil_config')
    @patch('backend.app.write_yggdrasil_config')
    @patch('backend.app.reload_yggdrasil')
    def test_api_exit_node_enable(self, mock_reload, mock_write, mock_read):
        """Test /api/exit-node endpoint (enable)."""
        # Mock config
        mock_read.return_value = {
            'TunnelRouting': {
                'Enable': False,
                'IPv6Destinations': []
            }
        }
        mock_write.return_value = True
        mock_reload.return_value = True
        
        response = self.client.post('/api/exit-node', 
                                   json={'enabled': True})
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['enabled'] is True
        assert '::/0' in data['advertised_routes']
    
    @patch('backend.app.read_yggdrasil_config')
    @patch('backend.app.write_yggdrasil_config')
    @patch('backend.app.reload_yggdrasil')
    def test_api_exit_node_disable(self, mock_reload, mock_write, mock_read):
        """Test /api/exit-node endpoint (disable)."""
        # Mock config with exit node enabled
        mock_read.return_value = {
            'TunnelRouting': {
                'Enable': True,
                'IPv6Destinations': ['::/0']
            }
        }
        mock_write.return_value = True
        mock_reload.return_value = True
        
        response = self.client.post('/api/exit-node',
                                   json={'enabled': False})
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert data['enabled'] is False
        assert '::/0' not in data['advertised_routes']


if __name__ == '__main__':
    # Run tests manually without pytest
    import sys
    
    print("🧪 Running Yggdrasil Commander Backend Tests\n")
    
    test_classes = [TestYggdrasilSocket, TestConfigManagement, TestAPIEndpoints]
    
    total_tests = 0
    passed_tests = 0
    
    for test_class in test_classes:
        print(f"\n📋 {test_class.__name__}")
        print("=" * 60)
        
        instance = test_class()
        if hasattr(instance, 'setup_method'):
            instance.setup_method()
        
        # Get all test methods
        test_methods = [m for m in dir(instance) if m.startswith('test_')]
        
        for method_name in test_methods:
            total_tests += 1
            try:
                method = getattr(instance, method_name)
                method()
                print(f"  ✅ {method_name}")
                passed_tests += 1
            except Exception as e:
                print(f"  ❌ {method_name}: {str(e)}")
    
    print("\n" + "=" * 60)
    print(f"📊 Results: {passed_tests}/{total_tests} tests passed")
    
    sys.exit(0 if passed_tests == total_tests else 1)
