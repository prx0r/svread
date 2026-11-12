#!/usr/bin/env python3
"""gateway.py — one HTTP MCP endpoint over estate-local and remote MCP servers.

ChatGPT and other remote clients speak Streamable HTTP. This gateway connects
to local stdio children and configured remote Streamable HTTP servers, prefixes
their tools `<server>__<tool>`, and routes calls to the right child. A server
that fails to connect is reported as a `gateway__problems` tool instead of
vanishing. Remote servers may use `allow_tools` to expose a closed tool set.

Auth: set MCP_TOKEN to require `Authorization: Bearer <token>`.

  python3 gateway.py                  # 0.0.0.0:8765, /mcp
  MCP_TOKEN=... python3 gateway.py
  python3 gateway.py --list           # print aggregated tools, exit
"""
from __future__ import annotations
import argparse
import json
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
CONF = json.loads((HERE / 'servers.json').read_text(encoding='utf-8'))
SERVERS: dict = CONF['servers']
CACHE_TTL = 60.0

from fastmcp import Client as FClient
from fastmcp.client.transports import StdioTransport
from mcp.server.lowlevel import Server
import mcp.types as types


def transport(cfg: dict) -> StdioTransport:
    env = dict(os.environ)
    env.update({k: str(v) for k, v in (cfg.get('env') or {}).items()})
    env['PYTHONPATH'] = str(cfg['cwd'])
    env.setdefault('PYTHONUNBUFFERED', '1')
    return StdioTransport(command=sys.executable, args=[cfg['path']],
                          cwd=cfg['cwd'], env=env)


def client_for(cfg: dict) -> FClient:
    """Build a client for either a local stdio server or a remote MCP URL."""
    if cfg.get('url'):
        return FClient(cfg['url'])
    return FClient(transport(cfg))


def _as_tool(t) -> types.Tool:
    if isinstance(t, types.Tool):
        return t
    schema = getattr(t, 'inputSchema', None) or getattr(t, 'input_schema', None) or {'type': 'object'}
    return types.Tool(name=t.name, description=getattr(t, 'description', None) or '',
                      inputSchema=schema)


async def probe(name: str):
    """Return (tools, error) for one server, opening a fresh MCP session."""
    try:
        cfg = SERVERS[name]
        async with client_for(cfg) as c:
            tools = [_as_tool(t) for t in await c.list_tools()]
            allow = cfg.get('allow_tools')
            if allow is not None:
                allowed = set(allow)
                tools = [t for t in tools if t.name in allowed]
            return tools, None
    except Exception as exc:
        return [], f'{type(exc).__name__}: {exc}'[:300]


_cache = {'at': 0.0, 'tools': [], 'problems': {}}


async def on_list_tools(_ctx, _params):
    if time.time() - _cache['at'] > CACHE_TTL:
        tools, problems, seen = [], {}, set()
        for name in SERVERS:
            got, err = await probe(name)
            if err:
                problems[name] = err
            for t in got:
                # most children are unnamespaced; the federation gateway already
                # ships <server>__<tool> names and must not be double-prefixed
                nm = t.name if SERVERS[name].get('namespace_tools') is False \
                    else f'{name}__{t.name}'
                if nm in seen:
                    nm = f'{name}__{t.name}'      # direct collisions get a prefix
                    if nm in seen:
                        continue
                seen.add(nm)
                # children sometimes declare an output schema but return only
                # text content; the client then refuses the result. Rebuild the
                # Tool without outputSchema so every tool stays callable.
                tools.append(types.Tool(name=nm, description=t.description or '',
                                        inputSchema=t.inputSchema))
        if problems:
            tools.append(types.Tool(
                name='gateway__problems',
                description='Servers that failed to start: ' +
                            json.dumps(problems, ensure_ascii=False),
                inputSchema={'type': 'object', 'properties': {}}))
        _cache.update({'at': time.time(), 'tools': tools, 'problems': problems})
    return types.ListToolsResult(tools=_cache['tools'])


async def on_call_tool(_ctx, p):
    name, _, tool = (p.name or '').partition('__')
    if name == 'gateway' and tool == 'problems':
        return types.CallToolResult(
            content=[types.TextContent(type='text',
                                       text=json.dumps(_cache['problems'], ensure_ascii=False))])
    if name not in SERVERS or not tool:
        return types.CallToolResult(
            content=[types.TextContent(type='text',
                                       text=f'unknown tool {p.name!r}; names are <server>__<tool>')],
            is_error=True)
    allow = SERVERS[name].get('allow_tools')
    if allow is not None and tool not in allow:
        return types.CallToolResult(
            content=[types.TextContent(type='text',
                                       text=f'tool {p.name!r} is not exposed by server {name!r}')],
            is_error=True)
    try:
        async with client_for(SERVERS[name]) as c:
            target = tool
            if SERVERS[name].get('namespace_tools') is False:
                names = {t.name for t in await c.list_tools()}
                if p.name in names:
                    target = p.name
            res = await c.call_tool(target, p.arguments or {})
            return types.CallToolResult(content=res.content,
                                        is_error=bool(getattr(res, 'is_error', False)))
    except Exception as exc:
        return types.CallToolResult(
            content=[types.TextContent(type='text', text=f'{type(exc).__name__}: {exc}'[:500])],
            is_error=True)


server = Server('svatantrya-gateway', version='1.0.0',
                on_list_tools=on_list_tools, on_call_tool=on_call_tool,
                instructions=('svatantrya.net estate: Sanskrit passages, translations, '
                              'bibliography, wheels, certificates, book/video factories. '
                              'Tool names are <server>__<tool>.'))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--host', default=os.environ.get('MCP_HOST', '0.0.0.0'))
    ap.add_argument('--port', type=int, default=int(os.environ.get('MCP_PORT', CONF.get('port', 8765))))
    ap.add_argument('--path', default=CONF.get('path', '/mcp'))
    ap.add_argument('--list', action='store_true')
    a = ap.parse_args()

    if a.list:
        import anyio

        async def run():
            res = await on_list_tools(None, None)
            for t in res.tools:
                print(f'{t.name:56} {(t.description or "")[:60]}')
            print(f'\n{len(res.tools)} tools across {len(SERVERS)} servers')
            for k, v in _cache['problems'].items():
                print(f'PROBLEM {k}: {v}')
        anyio.run(run)
        return 0

    import uvicorn
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.responses import JSONResponse, PlainTextResponse
    from starlette.routing import Route

    token = os.environ.get('MCP_TOKEN', '')

    async def health(_request):
        return PlainTextResponse(f'ok {len(SERVERS)} servers')

    # a public tunnel presents its own Host header; the SDK's rebinding guard
    # would answer 404 to every request that is not localhost
    from mcp.server.transport_security import TransportSecuritySettings
    app = server.streamable_http_app(
        streamable_http_path=a.path, stateless_http=True, host=a.host,
        transport_security=TransportSecuritySettings(enable_dns_rebinding_protection=False),
        custom_starlette_routes=[Route('/health', health)])

    if token:
        class Bearer(BaseHTTPMiddleware):
            async def dispatch(self, request, call_next):
                if request.url.path == '/health':
                    return await call_next(request)
                if request.headers.get('authorization') != f'Bearer {token}':
                    return JSONResponse({'error': 'unauthorized'}, status_code=401)
                return await call_next(request)
        app.add_middleware(Bearer)

    print(f'gateway: http://{a.host}:{a.port}{a.path} '
          f'({len(SERVERS)} servers, auth={"bearer" if token else "open"})', flush=True)
    uvicorn.run(app, host=a.host, port=a.port, log_level='warning')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
