FROM alpine:latest

# Install server utilities and services
RUN apk add --no-cache \
    iproute2 \
    iputils \
    net-tools \
    iptables \
    nginx \
    apache2-utils \
    openssh \
    tcpdump \
    nmap \
    curl \
    wget \
    bash \
    vim \
    python3 \
    nodejs \
    npm

# Create configuration directories
RUN mkdir -p /etc/nginx /var/www/html /etc/ssh

# Copy configuration templates
COPY configs/nginx/ /etc/nginx/
COPY configs/ssh/ /etc/ssh/
COPY configs/web/ /var/www/html/

# Create startup script
COPY scripts/start-server.sh /usr/local/bin/start-server.sh
RUN chmod +x /usr/local/bin/start-server.sh

# Expose common server ports
EXPOSE 22 80 443 8080

# Set environment variables
ENV DEVICE_TYPE=server
ENV DEVICE_VENDOR=generic

# Start the server services
CMD ["/usr/local/bin/start-server.sh"]
