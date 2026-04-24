#!/bin/bash

set -e

echo "Starting network switch..."

# Configure loopback interface
ip addr add 127.0.0.1/8 dev lo
ip link set lo up

# Load kernel modules for switching
modprobe 8021q
modprobe bridge

# Start Open vSwitch if configured
if command -v ovs-vswitchd &> /dev/null; then
    echo "Starting Open vSwitch..."
    
    # Initialize OVS database
    if [ ! -f /etc/openvswitch/conf.db ]; then
        ovsdb-tool create /etc/openvswitch/conf.db /usr/share/openvswitch/vswitch.ovsschema
    fi
    
    # Start OVSDB server
    ovsdb-server --remote=punix:/var/run/openvswitch/db.sock \
                  --remote=db:Open_vSwitch,Open_vSwitch,manager_options \
                  --private-key=db:Open_vSwitch,SSL,private_key \
                  --certificate=db:Open_vSwitch,SSL,certificate \
                  --bootstrap-ca-cert=db:Open_vSwitch,SSL,ca_cert \
                  --pidfile --detach --log-file
    
    # Start OVS switch daemon
    ovs-vswitchd --pidfile --detach --log-file
    
    # Initialize the switch
    ovs-vsctl --no-wait init
    
    echo "Open vSwitch started successfully"
fi

# Configure bridge interfaces
if [ -d /etc/network/interfaces.d ]; then
    for config in /etc/network/interfaces.d/*.conf; do
        if [ -f "$config" ]; then
            echo "Applying bridge configuration from $config"
            source "$config"
        fi
    done
fi

# Configure VLANs if specified
if [ -f /etc/openvswitch/vlans.conf ]; then
    echo "Configuring VLANs..."
    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ $line =~ ^[[:space:]]*# ]] && continue
        [[ -z $line ]] && continue
        
        # Parse VLAN configuration
        IFS=',' read -r bridge vlan_id ports <<< "$line"
        
        echo "Creating VLAN $vlan_id on bridge $bridge with ports: $ports"
        
        # Create VLAN bridge
        ovs-vsctl --may-exist add-br "${bridge}.${vlan_id}"
        ovs-vsctl set bridge "${bridge}.${vlan_id}" vlan_mode=access
        ovs-vsctl set port "${bridge}.${vlan_id}" tag="$vlan_id"
        
        # Add ports to VLAN
        for port in $ports; do
            ovs-vsctl --may-exist add-port "${bridge}.${vlan_id}" "$port"
        done
    done < /etc/openvswitch/vlans.conf
fi

# Start SSH daemon
if [ -f /etc/ssh/sshd_config ]; then
    echo "Starting SSH daemon..."
    /usr/sbin/sshd -D &
fi

# Enable IP forwarding for layer 3 switching
echo 1 > /proc/sys/net/ipv4/ip_forward

# Start a simple web interface for management
if [ -f /var/www/html/index.html ]; then
    echo "Starting web management interface..."
    python3 -m http.server 8080 --directory /var/www/html &
fi

echo "Switch startup complete. Device type: $DEVICE_TYPE, Vendor: $DEVICE_VENDOR"

# Keep the container running
tail -f /dev/null
