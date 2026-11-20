import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class McpReflection(unittest.TestCase):
    """The public gateway must only allowlist tools the server actually runs."""

    def test_gateway_allowlists_match_server(self):
        r = subprocess.run(
            [sys.executable, str(ROOT / "tools" / "check_mcp_reflection.py"), "--quiet"],
            cwd=ROOT, capture_output=True, text=True, timeout=120,
        )
        self.assertEqual(
            r.returncode, 0,
            "MCP reflection gate failed (stale allowlist entry):\n"
            + (r.stdout or "") + (r.stderr or ""),
        )


if __name__ == "__main__":
    unittest.main()
