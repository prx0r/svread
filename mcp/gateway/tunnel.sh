#!/bin/sh
# quick tunnel to the gateway; writes its URL to ../logs/tunnel-live.log
cd "$(dirname "$0")/.."
mkdir -p logs
setsid cloudflared tunnel --url http://127.0.0.1:8765 --no-autoupdate \
  > logs/tunnel-live.log 2>&1 < /dev/null &
sleep 1
