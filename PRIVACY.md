# Privacy Policy — Find in Everything

Last updated: 2026-07-20

## Overview

Find in Everything is a Chrome extension developed by Byosoku Labs. This document explains what data is processed, where it is stored, and who can access it.

This extension searches your local Everything HTTP Server. It does **not** send search queries or file paths to Byosoku Labs or any developer-operated backend.

## Data the extension processes

| Data | Purpose | Leaves your device? |
|------|---------|---------------------|
| Selected text / search queries | Query Everything HTTP Server | Only to the URL you configure (default `http://localhost:8080`) |
| Search result paths / metadata | Display results in Popup / Side Panel | No (shown only inside extension pages) |
| Extension settings | Persist preferences | Via Chrome sync (see below) |
| Optional HTTP Basic credentials | Authenticate to Everything HTTP Server | No (encrypted at rest; see below) |

The extension does not use analytics, advertising SDKs, crash reporting, or third-party trackers.

## Where data is stored

### `chrome.storage.sync`

Settings such as server URL, timeout, result count, and search defaults. If you are signed into Chrome with sync enabled, these values may sync across your signed-in Chrome profiles through Google’s sync infrastructure. Byosoku Labs does not operate that sync service.

### `chrome.storage.session`

Temporary UI state (last query, pagination, options) and, while unlocked, decrypted HTTP credentials in memory for the browser session. Unlocked credentials automatically lock after about 30 minutes of unlock time (or sooner if you lock manually / close the browser session storage).

### `chrome.storage.local`

Optional encrypted HTTP credentials (PBKDF2 + AES-GCM) and a few local flags. The master passphrase is never stored. Forgetting the passphrase means the stored credentials cannot be recovered.

## Network access

- Required host access: `http://localhost:8080/*` and `http://127.0.0.1:8080/*`.
- Other localhost ports require an explicit optional permission grant when you save or test a non-default URL in the options page.
- Only `http://localhost` and `http://127.0.0.1` are supported.
- Securing Everything HTTP Server (bind address, authentication, firewall) is the user’s responsibility. Exposing it on a LAN may reveal indexed paths to other devices.

## UI and page isolation

Search results are shown only in the extension Popup and Side Panel. The extension does not inject results into web page DOM and does not use a content script for search UI.

## Contact

- Developer: Byosoku Labs
- Security / privacy inquiries: open a GitHub issue on the project repository, or contact the developer via the Chrome Web Store listing support channel once published.

If this policy is hosted at a public URL for the Chrome Web Store, that URL is the canonical copy.
