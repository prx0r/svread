#!/bin/sh
# start the MCP gateway (repo copy). Logs go to mcp/gateway/logs/.
set -e
cd "$(dirname "$0")"
mkdir -p logs
if [ -z "$MCP_TOKEN" ]; then
  if [ -s logs/token ]; then MCP_TOKEN=$(cat logs/token); else
    MCP_TOKEN=$(openssl rand -hex 24); printf '%s' "$MCP_TOKEN" > logs/token; chmod 600 logs/token
  fi
fi
export MCP_TOKEN
if pgrep -f "gateway.py --host" >/dev/null 2>&1; then
  echo "already running"; echo "token: $MCP_TOKEN"; exit 0
fi
setsid nohup python3 gateway.py --host "${MCP_HOST:-127.0.0.1}" --port "${MCP_PORT:-8765}" \
  </dev/null > logs/gateway.log 2>&1 &
sleep 3
echo "token: $MCP_TOKEN"
curl -s "http://127.0.0.1:${MCP_PORT:-8765}/health" || true
