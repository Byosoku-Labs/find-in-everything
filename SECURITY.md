# Security Policy

Repository: https://github.com/Byosoku-Labs/find-in-everything

## Supported versions

Security fixes are applied to the latest `develop` / release commit of this repository. Older packaged builds are not patched in place; update to a new build.

## Reporting a vulnerability

Please report security issues privately when possible. Preferred order:

1. **GitHub Security Advisory (preferred)**  
   https://github.com/Byosoku-Labs/find-in-everything/security/advisories/new
2. **GitHub Issues (without exploit details)**  
   https://github.com/Byosoku-Labs/find-in-everything/issues  
   Request a private channel; do not post steps that would help attackers.
3. **Chrome Web Store listing support** (after publication)  
   Contact Byosoku Labs through the listing support channel.

Organization: https://github.com/Byosoku-Labs

Please include:

- Affected commit or extension version
- Steps to reproduce
- Impact (e.g. credential exposure, unexpected host access)

We aim to acknowledge reports within a reasonable time and will coordinate disclosure after a fix is available.

## Scope notes

- This extension talks only to a user-configured Everything HTTP Server on localhost / 127.0.0.1.
- Host permissions default to port `8080`; other ports require an explicit optional permission grant.
- Unlocked HTTP credentials are held in session storage for a limited time and are cleared by an automatic lock alarm.

## Related documents

- Privacy policy: https://github.com/Byosoku-Labs/find-in-everything/blob/develop/PRIVACY.md
- Source code: https://github.com/Byosoku-Labs/find-in-everything
