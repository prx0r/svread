#!/usr/bin/env python3
"""smoke.py — connect to the gateway and prove three tools answer."""
import anyio, os, sys
from fastmcp import Client

URL = os.environ.get('MCP_URL', 'http://127.0.0.1:8765/mcp')

async def main():
    async with Client(URL) as c:
        tools = await c.list_tools()
        print(f'tools: {len(tools)}')
        ok = 0
        for name, args in [('scholar__list_works', {}),
                           ('scholar__wheel_level', {'level': 1}),
                           ('federation__guide', {})]:
            try:
                r = await c.call_tool(name, args)
                body = r.content[0].text if r.content else ''
                print(f'OK  {name} -> {body[:100].replace(chr(10), " ")}')
                ok += 1
            except Exception as e:
                print(f'ERR {name}: {type(e).__name__}: {str(e)[:120]}')
        print(('PASS' if ok == 3 else f'PARTIAL {ok}/3'))

anyio.run(main)
