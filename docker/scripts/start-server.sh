#!/bin/bash

set -e

echo "Starting network server..."

# Configure loopback interface
ip addr add 127.0.0.1/8 dev lo
ip link set lo up

# Configure network interfaces
if [ -d /etc/network/interfaces.d ]; then
    for config in /etc/network/interfaces.d/*.conf; do
        if [ -f "$config" ]; then
            echo "Applying interface configuration from $config"
            source "$config"
        fi
    done
fi

# Start SSH daemon
if [ -f /etc/ssh/sshd_config ]; then
    echo "Starting SSH daemon..."
    
    # Generate host keys if they don't exist
    if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
        ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key -N ''
    fi
    
    /usr/sbin/sshd -D &
fi

# Start Nginx web server
if [ -f /etc/nginx/nginx.conf ]; then
    echo "Starting Nginx web server..."
    /usr/sbin/nginx -g 'daemon on;' &
fi

# Start Apache if configured
if [ -f /etc/apache2/httpd.conf ]; then
    echo "Starting Apache web server..."
    /usr/sbin/httpd -D FOREGROUND &
fi

# Configure firewall rules
if [ -f /etc/iptables/rules.v4 ]; then
    echo "Applying iptables rules..."
    iptables-restore < /etc/iptables/rules.v4
fi

# Start monitoring services
if command -v tcpdump &> /dev/null; then
    echo "Network monitoring tools available"
fi

# Create a simple status page
cat > /var/www/html/status.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Server Status</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status { background: #f0f0f0; padding: 10px; border-radius: 5px; }
        .ok { color: green; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1>Network Server Status</h1>
    <div class="status">
        <h2>System Information</h2>
        <p><strong>Device Type:</strong> $DEVICE_TYPE</p>
        <p><strong>Vendor:</strong> $DEVICE_VENDOR</p>
        <p><strong>IP Address:</strong> <span id="ip">Loading...</span></p>
        <p><strong>Uptime:</strong> <span id="uptime">Loading...</span></p>
    </div>
    
    <div class="status">
        <h2>Network Interfaces</h2>
        <pre id="interfaces">Loading...</pre>
    </div>
    
    <script>
        // Load IP address
        fetch('/api/ip')
            .then(response => response.text())
            .then(data => document.getElementById('ip').textContent = data)
            .catch(() => document.getElementById('ip').textContent = 'Unknown');
        
        // Load uptime
        document.getElementById('uptime').textContent = new Date().toLocaleString();
        
        // Load network interfaces
        fetch('/api/interfaces')
            .then(response => response.text())
            .then(data => document.getElementById('interfaces').textContent = data)
            .catch(() => document.getElementById('interfaces').textContent = 'Unable to load');
    </script>
</body>
</html>
EOF

# Create simple API endpoints for status
mkdir -p /var/www/cgi-bin

cat > /var/www/cgi-bin/ip.sh << 'EOF'
#!/bin/bash
echo "Content-Type: text/plain"
echo ""
hostname -I | awk '{print $1}'
EOF

cat > /var/www/cgi-bin/interfaces.sh << 'EOF'
#!/bin/bash
echo "Content-Type: text/plain"
echo ""
ip addr show
EOF

chmod +x /var/www/cgi-bin/*.sh

# Start a simple Python web server for API endpoints
if command -v python3 &> /dev/null; then
    cat > /tmp/simple_api.py << 'EOF'
from http.server import CGIHTTPRequestHandler, HTTPServer
import os

class APIHandler(CGIHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.cgi_info = ('/var/www/cgi-bin', self.path)
            CGIHTTPRequestHandler.do_GET(self)
        else:
            super().do_GET()

if __name__ == '__main__':
    os.chdir('/var/www/html')
    server = HTTPServer(('', 8080), APIHandler)
    server.serve_forever()
EOF
    
    echo "Starting API server on port 8080..."
    python3 /tmp/simple_api.py &
fi

echo "Server startup complete. Device type: $DEVICE_TYPE, Vendor: $DEVICE_VENDOR"

# Keep the container running
tail -f /dev/null
