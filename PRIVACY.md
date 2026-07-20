# プライバシーポリシー — Find in Everything

最終更新: 2026-07-20

正規 URL（Chrome ウェブストアおよび公開参照用）:

https://github.com/Byosoku-Labs/find-in-everything/blob/develop/PRIVACY.md

## 概要

Find in Everything は [Byosoku Labs](https://github.com/Byosoku-Labs) が開発する Chrome 拡張機能です。本ポリシーは、どのようなデータが処理され、どこに保存され、誰がアクセスし得るかを説明します。

リポジトリ: https://github.com/Byosoku-Labs/find-in-everything

本拡張機能は、ユーザー自身の Everything HTTP Server に対して検索を行います。検索クエリやファイルパスを Byosoku Labs や開発者が運営する外部サーバーへ送信することはありません。

## 処理するデータ

| データ | 目的 | 端末外へ出るか |
|------|---------|---------------------|
| 選択文字列 / 検索クエリ | Everything HTTP Server への問い合わせ | ユーザーが設定した URL のみ（既定は `http://localhost:8080`） |
| 検索結果のパス / メタデータ | Popup / Side Panel での表示 | いいえ（拡張機能ページ内のみ） |
| 拡張機能の設定 | 設定の保持 | Chrome の同期経由（下記参照） |
| 任意の HTTP Basic 認証情報 | Everything HTTP Server への認証 | いいえ（保存時は暗号化。下記参照） |

本拡張機能は、分析ツール、広告 SDK、クラッシュレポート、サードパーティのトラッカーを使用しません。

## データの保存場所

### `chrome.storage.sync`

サーバー URL、タイムアウト、結果件数、検索の既定値などの設定。Chrome にサインインし同期が有効な場合、これらの値は Google の同期基盤を通じて、サインイン中の Chrome プロファイル間で同期されることがあります。Byosoku Labs はその同期サービスを運営していません。

### `chrome.storage.session`

一時的な UI 状態（直近のクエリ、ページング、オプション）と、ロック解除中のみセッション内に保持される復号済み HTTP 認証情報。ロック解除後の認証情報は、約 30 分で自動的に再ロックされます。手動でロックした場合、またはセッションストレージが終了した場合は、それより早くロックされます。

### `chrome.storage.local`

任意の暗号化済み HTTP 認証情報（PBKDF2 + AES-GCM）および一部のローカルフラグ。マスターパスフレーズ自体は保存しません。パスフレーズを忘れると、保存済み認証情報は復元できません。

## ネットワークアクセス

- 必須のホスト権限: `http://localhost:8080/*` および `http://127.0.0.1:8080/*`
- その他の localhost ポートは、設定画面で非既定 URL を保存または接続テストする際に、任意権限の許可が必要です
- サポートするのは `http://localhost` と `http://127.0.0.1` のみです
- Everything HTTP Server の待ち受けアドレス・認証・ファイアウォール等のセキュリティ設定はユーザーの責任です。LAN へ公開すると、インデックスされたパスが他端末から見える可能性があります

## UI とページの分離

検索結果は拡張機能の Popup および Side Panel にのみ表示されます。Web ページの DOM へ結果を挿入せず、検索 UI 用の content script も使用しません。

## 連絡先

- 組織: [Byosoku Labs](https://github.com/Byosoku-Labs)
- リポジトリ: https://github.com/Byosoku-Labs/find-in-everything
- プライバシーおよび一般的な質問: https://github.com/Byosoku-Labs/find-in-everything/issues
- セキュリティ上の脆弱性: [SECURITY.md](./SECURITY.md) および https://github.com/Byosoku-Labs/find-in-everything/security/advisories
- Chrome ウェブストア公開後: ストア掲載ページのサポート / 連絡チャネルも利用できます

本リポジトリの `develop` ブランチにある本ファイルが、正規のプライバシーポリシーです。

---

# Privacy Policy — Find in Everything

Last updated: 2026-07-20

Canonical URL (for Chrome Web Store and public reference):

https://github.com/Byosoku-Labs/find-in-everything/blob/develop/PRIVACY.md

## Overview

Find in Everything is a Chrome extension developed by [Byosoku Labs](https://github.com/Byosoku-Labs). This document explains what data is processed, where it is stored, and who can access it.

Repository: https://github.com/Byosoku-Labs/find-in-everything

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

- Organization: [Byosoku Labs](https://github.com/Byosoku-Labs)
- Repository: https://github.com/Byosoku-Labs/find-in-everything
- Privacy and general questions: https://github.com/Byosoku-Labs/find-in-everything/issues
- Security vulnerabilities: see [SECURITY.md](./SECURITY.md) and https://github.com/Byosoku-Labs/find-in-everything/security/advisories
- After Chrome Web Store publication: the listing’s support / contact channel may also be used

This file in the `develop` branch of the repository is the canonical privacy policy.
