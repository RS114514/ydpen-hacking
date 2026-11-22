#!/bin/sh
rm -rf /tmp/rec
mkdir -p /tmp/rec
touch /tmp/rec/running
i=0
while [ -f /tmp/rec/running ]; do
    miniapp_cli capture /tmp/rec/f_$(printf "%04d" $i).png >/dev/null 2>&1
    i=$((i+1))
    usleep 80000
done
