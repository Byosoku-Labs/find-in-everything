# Security Policy

## Supported versions

Security fixes are applied to the latest `develop` / release commit of this repository. Older packaged builds are not patched in place; update to a new build.

## Reporting a vulnerability

Please report security issues privately when possible:

1. Prefer a private GitHub Security Advisory on the repository (if available), or
2. Open a GitHub issue without including exploit details that would help attackers, and request a private channel, or
3. Contact Byosoku Labs through the Chrome Web Store listing support channel once the extension is published.

Please include:

- Affected commit or extension version
- Steps to reproduce
- Impact (e.g. credential exposure, unexpected host access)

We aim to acknowledge reports within a reasonable time and will coordinate disclosure after a fix is available.

## Scope notes

- This extension talks only to a user-configured Everything HTTP Server on localhost / 127.0.0.1.
- Host permissions default to port `8080`; other ports require an explicit optional permission grant.
- Unlocked HTTP credentials are held in session storage for a limited time and are cleared by an automatic lock alarm.
