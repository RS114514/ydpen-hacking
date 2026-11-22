#!/bin/sh
TAP="/userdisk/doom/tap_mt /dev/input/event1"
FWD="176 819"; TR="176 729"; TL="176 909"
FIRE="304 80"; USE="304 160"; WEAPON="192 139"; SPEED="192 234"

t() { $TAP $1 $2 >/dev/null 2>&1; usleep 120000; }

sleep 1.6
t $FWD; usleep 300000
t $FWD; usleep 300000
t $FWD; usleep 300000
t $FIRE; usleep 250000
t $TR;  usleep 250000
t $FWD; usleep 300000
t $FWD; usleep 300000
t $USE; usleep 350000
t $FWD; usleep 300000
t $FIRE; usleep 200000
t $FIRE; usleep 300000
t $TL;  usleep 300000
t $FWD; usleep 300000
t $FWD; usleep 300000
t $FIRE; usleep 250000
t $TR;  usleep 300000
t $FWD; usleep 300000
t $FWD; usleep 300000
t $FIRE; usleep 250000
t $WEAPON; usleep 300000
t $FWD; usleep 300000
t $FIRE; usleep 250000
t $TL;  usleep 300000
t $FWD; usleep 300000
echo PLAY2_DONE
