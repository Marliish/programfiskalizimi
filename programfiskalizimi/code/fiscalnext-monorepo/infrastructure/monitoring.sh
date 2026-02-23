#!/bin/bash
# System monitoring script

echo "=== FiscalNext System Status ==="
echo ""
echo "Docker Containers:"
docker ps --format "{{.Names}}: {{.Status}}"
echo ""
echo "Disk Usage:"
df -h /
echo ""
echo "Memory:"
vm_stat | perl -ne '/page size of (\d+)/ and $size=$1; /Pages\s+([^:]+)[^\d]+(\d+)/ and printf("%-16s % 16.2f Mi\n", "$1:", $2 * $size / 1048576);'
