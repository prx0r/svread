#!/bin/sh
# run the named Cloudflare tunnel that serves https://mcp.sanskrit.help/mcp
# needs a remotely-managed tunnel token (Cloudflare API -> cfd_tunnel -> token)
TOKEN_FILE="${TOKEN_FILE:-/root/svatantrya-workspace/logs/tunnel-token}"
[ -s "$TOKEN_FILE" ] || { echo "no tunnel token at $TOKEN_FILE" >&2; exit 1; }
cd "$(dirname "$0")"; mkdir -p logs
setsid nohup cloudflared tunnel run --token "$(cat "$TOKEN_FILE")" \
  </dev/null > logs/tunnel-mcp.log 2>&1 &
sleep 2; echo "tunnel started; check https://mcp.sanskrit.help/health"
