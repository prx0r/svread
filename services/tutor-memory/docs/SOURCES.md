# Research references checked 2026-11-12

- [OpenAI: Memory in ChatGPT](https://help.openai.com/en/articles/8590148-memory-in-chatgpt): host memory is selective and user-managed; not a precise application progress datastore.
- [OpenAI: Plugin architecture](https://developers.openai.com/plugins/concepts/plugins): plugin = skills + optional MCP backend + optional UI.
- [OpenAI: Skills](https://developers.openai.com/plugins/concepts/skills): instructions for repeatable tutor workflows.
- [OpenAI: Build an MCP server](https://developers.openai.com/plugins/build/mcp-server): structured content, auth, bounded outputs, per-account scoping.
- [OpenAI: Authentication](https://developers.openai.com/plugins/build/auth): OAuth 2.1, PKCE, resource metadata, token verification.
- [OpenAI: Manage UI state](https://developers.openai.com/plugins/build/chatgpt-ui): durable server state distinct from ephemeral UI/widget state.
- [OpenAI: Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines): purpose-limited inputs, minimize personal data, privacy policy.
- [OpenAI: Security and privacy](https://developers.openai.com/plugins/guides/security-privacy): authorization and prompt injection defenses, logging/retention.
- [Open Spaced Repetition: FSRS algorithm](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm): optional future review scheduler; do not reimplement casually.
- [Dunlosky et al., Improving Students' Learning With Effective Learning Techniques](https://bibliotecadigital.mineduc.cl/bitstream/handle/20.500.12365/17388/dunloskyimprovinglearning.pdf): practice testing and spaced practice as well-supported learning techniques. General evidence, not validation of our specific mastery thresholds.

Sources are design references. This package has **not** connected to the user's live Svatantrya estate, production database or ChatGPT account.
