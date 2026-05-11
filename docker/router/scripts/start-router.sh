#!/bin/bash

# Start FRRouting services
echo "Starting FRRouting daemons..."

# Start FRR services
/usr/lib/frr/frr start

# Keep container running
tail -f /dev/null
