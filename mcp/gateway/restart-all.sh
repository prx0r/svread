#!/usr/bin/env bash
# Restart every MCP host after a gateway.py or child-server change.
# All units import gateway.py fresh on start; a stale one answers tools/list
# from an old code path and fails tools/call with "unknown tool".
set -e
UNITS="svatantrya-mcp svatantrya-mcp-index svatantrya-mcp-sanskrit svatantrya-mcp-practice
svatantrya-mcp-formal svatantrya-mcp-translate svatantrya-mcp-tutor svatantrya-mcp-essay
svatantrya-mcp-books svatantrya-mcp-video svatantrya-mcp-nibbana svatantrya-mcp-svatantrya
svatantrya-mcp-studio svatantrya-mcp-factory"
for u in $UNITS; do systemctl restart "$u" 2>/dev/null && echo "restarted $u"; done
sleep 4
fail=0
for u in $UNITS; do
  st=$(systemctl is-active "$u" || true)
  [ "$st" = "active" ] || { echo "FAIL $u: $st"; fail=1; }
done
[ "$fail" = 0 ] && echo "all hosts active"
