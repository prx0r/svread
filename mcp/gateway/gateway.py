#!/usr/bin/env python3
"""gateway.py — one HTTP MCP endpoint over every stdio MCP server in the estate.

All our servers are stdio scripts; ChatGPT and other remote clients speak
Streamable HTTP. This gateway spawns each child on demand, prefixes its tools
`<server>__<tool>`, and routes calls back to the right child. A child that
fails to start is reported as a `gateway__problems` tool instead of vanishing.

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


def _config_path() -> Path:
    for i, a in enumerate(sys.argv):
        if a == '--config' and i + 1 < len(sys.argv):
            return Path(sys.argv[i + 1])
        if a.startswith('--config='):
            return Path(a.split('=', 1)[1])
    return Path(os.environ.get('MCP_SERVERS_JSON', HERE / 'servers.json'))


CONF = json.loads(_config_path().read_text(encoding='utf-8'))
SERVERS: dict = CONF['servers']
CACHE_TTL = 60.0
DEFAULT_INSTRUCTIONS = ('svatantrya.net estate: Sanskrit passages, translations, '
                        'bibliography, wheels, certificates, book/video factories. '
                        'Tool names are <server>__<tool>.')

from fastmcp import Client as FClient
from fastmcp.client.transports import StdioTransport
from mcp.server.lowlevel import Server
import mcp.types as types


def transport(cfg: dict) -> StdioTransport:
    env = dict(os.environ)
    env.update({k: str(v) for k, v in (cfg.get('env') or {}).items()})
    env['PYTHONPATH'] = str(cfg['cwd'])
    args = [cfg['path'], *(cfg.get('args') or [])]
    return StdioTransport(command=sys.executable, args=args,
                          cwd=cfg['cwd'], env=env)


def _as_tool(t) -> types.Tool:
    if isinstance(t, types.Tool):
        return t
    schema = getattr(t, 'inputSchema', None) or getattr(t, 'input_schema', None) or {'type': 'object'}
    return types.Tool(name=t.name, description=getattr(t, 'description', None) or '',
                      inputSchema=schema)


async def probe(name: str):
    """Return (tools, error) for one child, opening a fresh stdio session."""
    try:
        async with FClient(transport(SERVERS[name])) as c:
            return [_as_tool(t) for t in await c.list_tools()], None
    except Exception as exc:
        return [], f'{type(exc).__name__}: {exc}'[:300]


_cache = {'at': 0.0, 'tools': [], 'problems': {}}


def _prefix(name: str) -> str | None:
    """Advertised prefix for a server: None means bare passthrough."""
    cfg = SERVERS[name]
    if cfg.get('namespace_tools') is False:
        return None
    return cfg.get('tool_prefix', f'{name}__')


def _route(advertised: str) -> tuple[str | None, str]:
    """Map an advertised tool name back to (server key, child tool)."""
    if advertised in _cache.get('by_name', {}):
        return _cache['by_name'][advertised]
    for key in SERVERS:
        cfg = SERVERS[key]
        if cfg.get('namespace_tools') is False:
            allow = cfg.get('tools_allow')
            if allow and advertised in allow:
                return key, advertised
            continue
        p = cfg.get('tool_prefix', f'{key}__')
        if advertised.startswith(p):
            return key, advertised[len(p):]
    if '__' in advertised:
        key, _, child = advertised.partition('__')
        if key in SERVERS:
            return key, child
    return None, advertised


def _allowed(name: str, advertised: str, child: str) -> bool:
    allow = SERVERS[name].get('tools_allow')
    if not allow:
        return True
    return advertised in allow or child in allow or f'{name}__{child}' in allow


async def on_list_tools(_ctx, _params):
    if time.time() - _cache['at'] > CACHE_TTL:
        tools, problems, seen = [], {}, set()
        by_name: dict = {}
        for name in SERVERS:
            got, err = await probe(name)
            if err:
                problems[name] = err
            for t in got:
                # most children are unnamespaced; the federation gateway already
                # ships <server>__<tool> names and must not be double-prefixed;
                # tool_prefix lets two entries share one script under one prefix
                pre = _prefix(name)
                nm = t.name if pre is None else f'{pre}{t.name}'
                if nm in seen:
                    nm = f'{name}__{t.name}'      # direct collisions get a prefix
                    if nm in seen:
                        continue
                if not _allowed(name, nm, t.name):
                    continue
                seen.add(nm)
                by_name[nm] = (name, t.name)
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
            by_name['gateway__problems'] = ('gateway', 'problems')
        _cache.update({'at': time.time(), 'tools': tools, 'problems': problems,
                       'by_name': by_name})
    return types.ListToolsResult(tools=_cache['tools'])


async def on_call_tool(_ctx, p):
    name, tool = _route(p.name or '')
    if name == 'gateway' and tool == 'problems':
        return types.CallToolResult(
            content=[types.TextContent(type='text',
                                        text=json.dumps(_cache['problems'], ensure_ascii=False))])
    if name not in SERVERS or not tool:
        return types.CallToolResult(
            content=[types.TextContent(type='text',
                                        text=f'unknown tool {p.name!r}; names are <server>__<tool>')],
            is_error=True)
    if not _allowed(name, p.name, tool):
        return types.CallToolResult(
            content=[types.TextContent(type='text',
                                        text=f'tool {p.name!r} is not exposed on this host')],
            is_error=True)
    try:
        async with FClient(transport(SERVERS[name])) as c:
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
                instructions=CONF.get('instructions', DEFAULT_INSTRUCTIONS))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--host', default=os.environ.get('MCP_HOST', '0.0.0.0'))
    ap.add_argument('--port', type=int, default=int(os.environ.get('MCP_PORT', CONF.get('port', 8765))))
    ap.add_argument('--path', default=CONF.get('path', '/mcp'))
    ap.add_argument('--config', default=str(_config_path()))
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
    public_base = CONF.get('public_base', '')

    async def health(_request):
        return PlainTextResponse(f'ok {len(SERVERS)} servers')

    async def protected_resource(_request):
        # RFC 9728 shape so OAuth-capable clients can discover auth config.
        # authorization_servers is empty until the OAuth write sheaf lands
        # (MCP-INTEGRATION.md §4); bearer hosts are owner-only until then.
        return JSONResponse({
            'resource': public_base or f'http://{a.host}:{a.port}{a.path}',
            'authorization_servers': [],
            'scopes_supported': [],
            'resource_documentation': 'https://svatantrya.net/about',
        })

    # a public tunnel presents its own Host header; the SDK's rebinding guard
    # would answer 404 to every request that is not localhost
    from mcp.server.transport_security import TransportSecuritySettings
    routes = [Route('/health', health),
                Route('/.well-known/oauth-protected-resource', protected_resource)]
    app = server.streamable_http_app(
        streamable_http_path=a.path, stateless_http=True, host=a.host,
        transport_security=TransportSecuritySettings(enable_dns_rebinding_protection=False),
        custom_starlette_routes=routes)

    auth_mode = CONF.get('auth_mode', 'bearer' if token else 'open')
    open_tools = set(CONF.get('open_tools', []))
    # read-only discovery methods callable without auth in mixed mode
    open_methods = {'initialize', 'tools/list', 'resources/list',
                    'resources/templates/list', 'prompts/list',
                    'resources/read', 'prompts/get', 'completion/complete',
                    'ping', 'logging/setLevel'}

    def _body_open(body: bytes) -> bool:
        try:
            msg = json.loads(body) if body else {}
        except ValueError:
            return False
        msgs = msg if isinstance(msg, list) else [msg]
        for m in msgs:
            if not isinstance(m, dict):
                return False
            method = m.get('method', '')
            if method.startswith('notifications/'):
                continue
            if method in open_methods:
                continue
            if method == 'tools/call':
                name = ((m.get('params') or {}).get('name')) or ''
                if name in open_tools:
                    continue
            return False
        return True

    if token and auth_mode in ('bearer', 'mixed'):
        meta_base = (public_base or f'http://{a.host}:{a.port}')
        if meta_base.endswith('/mcp'):
            meta_base = meta_base[:-len('/mcp')]
        www_auth = ('Bearer resource_metadata="'
                    + meta_base +
                    '/.well-known/oauth-protected-resource"')

        def _denied():
            return JSONResponse({'error': 'unauthorized'}, status_code=401,
                                headers={'WWW-Authenticate': www_auth})

        class Bearer(BaseHTTPMiddleware):
            async def dispatch(self, request, call_next):
                if request.url.path in ('/health', '/.well-known/oauth-protected-resource'):
                    return await call_next(request)
                if request.headers.get('authorization') == f'Bearer {token}':
                    return await call_next(request)
                if auth_mode == 'mixed' and request.url.path == a.path:
                    body = await request.body()

                    async def _replay():
                        return {'type': 'http.request', 'body': body,
                                'more_body': False}
                    if _body_open(body):
                        from starlette.requests import Request as StarRequest
                        return await call_next(StarRequest(request.scope, _replay))
                return _denied()
        app.add_middleware(Bearer)

    print(f'gateway: http://{a.host}:{a.port}{a.path} '
          f'({len(SERVERS)} servers, auth={"bearer" if token else "open"})', flush=True)
    uvicorn.run(app, host=a.host, port=a.port, log_level='warning')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
