FROM frrouting/frr:latest

# Install additional networking tools (Alpine Linux)
RUN apk add --no-cache \
    iproute2 \
    iputils \
    net-tools \
    iptables \
    tcpdump \
    nmap \
    curl \
    wget \
    vim \
    busybox-extras \
    openssh-client

# Create FRR configuration directories
RUN mkdir -p /etc/frr /etc/network/interfaces.d

# Copy FRR configuration templates
COPY configs/frr/ /etc/frr/
COPY configs/network/ /etc/network/

# Set permissions for FRR
RUN chown -R frr:frr /etc/frr && \
    chmod 640 /etc/frr/*.conf

# Create startup script
COPY scripts/start-router.sh /usr/local/bin/start-router.sh
RUN chmod +x /usr/local/bin/start-router.sh

# Expose common management ports
EXPOSE 22 80 443 161

# Set environment variables
ENV DEVICE_TYPE=router
ENV DEVICE_VENDOR=cisco

# Enable FRR daemons
COPY daemons /etc/frr/daemons

# Start FRR services
CMD ["frrstart"]
