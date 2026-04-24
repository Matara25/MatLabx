FROM alpine:latest

# Install basic networking tools and switch utilities
RUN apk add --no-cache \
    iproute2 \
    iputils \
    net-tools \
    iptables \
    bridge-utils \
    openvswitch \
    tcpdump \
    nmap \
    curl \
    wget \
    bash \
    vim

# Create configuration directories
RUN mkdir -p /etc/openvswitch /etc/network/interfaces.d

# Copy configuration templates
COPY configs/ovs/ /etc/openvswitch/
COPY configs/network/ /etc/network/

# Create startup script
COPY scripts/start-switch.sh /usr/local/bin/start-switch.sh
RUN chmod +x /usr/local/bin/start-switch.sh

# Expose management ports
EXPOSE 22 80 443

# Set environment variables
ENV DEVICE_TYPE=switch
ENV DEVICE_VENDOR=generic

# Start the switch services
CMD ["/usr/local/bin/start-switch.sh"]
