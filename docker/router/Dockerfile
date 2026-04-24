FROM alpine:latest

# Install basic networking tools
RUN apk add --no-cache \
    iproute2 \
    iputils \
    net-tools \
    iptables \
    quagga \
    bird \
    tcpdump \
    nmap \
    curl \
    wget \
    bash \
    vim

# Create configuration directories
RUN mkdir -p /etc/quagga /etc/bird /etc/network/interfaces.d

# Copy configuration templates
COPY configs/quagga/ /etc/quagga/
COPY configs/bird/ /etc/bird/
COPY configs/network/ /etc/network/

# Set permissions for Quagga
RUN chown -R quagga:quagga /etc/quagga && \
    chmod 640 /etc/quagga/*.conf

# Create startup script
COPY scripts/start-router.sh /usr/local/bin/start-router.sh
RUN chmod +x /usr/local/bin/start-router.sh

# Expose common management ports
EXPOSE 22 80 443 161

# Set environment variables
ENV DEVICE_TYPE=router
ENV DEVICE_VENDOR=generic

# Start the router services
CMD ["/usr/local/bin/start-router.sh"]
