#!/bin/bash

set -e

echo "Starting network router..."

# Configure loopback interface
ip addr add 127.0.0.1/8 dev lo
ip link set lo up

# Load kernel modules for routing
modprobe ip_tables
modprobe iptable_nat
modprobe iptable_filter
modprobe iptable_mangle

# Enable IP forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward

# Start Quagga daemons if configured
if [ -f /etc/quagga/zebra.conf ]; then
    echo "Starting Zebra..."
    /usr/sbin/zebra -d -f /etc/quagga/zebra.conf
fi

if [ -f /etc/quagga/ospfd.conf ]; then
    echo "Starting OSPF daemon..."
    /usr/sbin/ospfd -d -f /etc/quagga/ospfd.conf
fi

if [ -f /etc/quagga/bgpd.conf ]; then
    echo "Starting BGP daemon..."
    /usr/sbin/bgpd -d -f /etc/quagga/bgpd.conf
fi

if [ -f /etc/quagga/ripd.conf ]; then
    echo "Starting RIP daemon..."
    /usr/sbin/ripd -d -f /etc/quagga/ripd.conf
fi

# Start BIRD if configured
if [ -f /etc/bird/bird.conf ]; then
    echo "Starting BIRD..."
    /usr/sbin/bird -d -c /etc/bird/bird.conf
fi

# Configure interfaces from environment variables or config files
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
    /usr/sbin/sshd -D &
fi

# Start a simple web interface for management
if [ -f /var/www/html/index.html ]; then
    echo "Starting web management interface..."
    python3 -m http.server 8080 --directory /var/www/html &
fi

echo "Router startup complete. Device type: $DEVICE_TYPE, Vendor: $DEVICE_VENDOR"

# Keep the container running
tail -f /dev/null
