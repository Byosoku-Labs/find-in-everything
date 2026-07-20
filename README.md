# Find in Everything

選択した文字列を Windows 向け高速ファイル検索ソフト **Everything** の HTTP サーバーへ送り、Chrome の Popup または Side Panel に結果を表示する拡張機能です。

Developed by Byosoku Labs.

> Find in Everything は独立した非公式のブラウザ拡張機能です。
> voidtools との提携・後援・スポンサー関係はありません。
> Everything は各権利者の商標です。
>
> Find in Everything is an independent, unofficial browser extension.
> It is not affiliated with, endorsed by, or sponsored by voidtools.
> Everything is a trademark of its respective owner.

**Everything 本体の別途インストールが必要です。** Native Messaging Host や独自の常駐アプリは使用しません。

## 主な機能

- Web ページ上の選択文字列を右クリックから Everything で検索
- 未選択時はページタイトルで検索
- 右クリック検索の結果は Chrome Side Panel に表示
- 拡張機能アイコンの Popup と Chrome Side Panel での詳細検索
- 検索オプション（大文字小文字 / パス / 正規表現 / 並び順）
- `es:` URL プロトコルで Everything 本体を開く
- Everything HTTP Server の接続テスト
- 任意の HTTP Basic 認証（マスターパスフレーズ + AES-GCM で永続化）

## スクリーンショット

（公開時に Popup・サイドパネル・設定画面・右クリックメニューの画像を配置してください）

## 必要な環境

- Google Chrome（Manifest V3）
- Windows
- Everything 1.4 または 1.5（HTTP Server 利用可能であること）
- Node.js 20 LTS 以降（開発・ビルド用）

## インストール（開発版）

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ビルド

```bash
npm run build
```

成果物は `dist/` に出力されます。

### 3. Chrome への読み込み

1. Chrome で `chrome://extensions` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」
4. このリポジトリの `dist` フォルダーを選択する

## Everything 側の設定

### Everything 1.4（推奨・既定案内）

1. Everything を起動する
2. **ツール → オプション → HTTPサーバー**
3. **HTTPサーバーを有効にする**
4. ポート番号を確認する（拡張機能の初期値は `8080`）
5. 必要に応じて全般設定から `es:` URL プロトコルを有効にする

ファイルのダウンロードを許可する必要はありません。

### Everything 1.5a / 1.5b

1.5 系では HTTP Server がプラグインです。

1. Everything 1.5 を起動する
2. [Plugins](https://www.voidtools.com/support/everything/plugins/) または [http_server releases](https://github.com/voidtools/http_server/releases) から HTTP Server プラグインを導入する
3. インストーラーで **Add**、または DLL を `Everything\Plugins` へ配置して再起動
4. 以降は 1.4 と同様に HTTP サーバーを有効化し、ポートを合わせる
5. 必要に応じて `es:` URL プロトコルを有効にする

### セキュリティ上の注意

- HTTP Server は **localhost のみ**での利用を推奨します
- LAN へ公開すると検索インデックスが他端末から見える可能性があります
- localhost 利用時はユーザー名/パスワードを空にすることを推奨します
- 認証を使う場合、拡張機能はマスターパスフレーズ（8文字以上）で認証情報を暗号化して保存します（パスフレーズ自体は保存しません）
- ロック解除後の認証情報はセッションに一時保持され、約 30 分で自動ロックされます
- 検索結果は Popup または Side Panel の拡張機能ページ内にのみ表示し、Web ページの DOM には挿入しません
- 既定のホスト権限はポート `8080` のみです。他ポートは設定保存時に追加許可が必要です

## 権限の説明

| 権限 | 用途 |
|------|------|
| `contextMenus` | 選択文字列の右クリックメニュー |
| `storage` | 設定・検索状態・暗号化認証情報の保存 |
| `sidePanel` | サイドパネル表示 |
| `clipboardWrite` | フルパスのコピー |
| `alarms` | ロック解除済み HTTP 認証の自動ロック |
| `http://localhost:8080/*` / `http://127.0.0.1:8080/*` | 既定ポートの Everything HTTP Server への検索 |
| （任意）`http://localhost:<port>/*` 等 | 設定画面で非 8080 ポートを保存/テストするときに要求 |

Native Host は使用しません。ローカルファイルの直接オープンやダウンロードは行いません。

## 開発

```bash
npm install
npm test
npm run build
npm run build:store
npm run lint
```

`npm run build:store` はソースマップなしの配布用ビルドです。

### ディレクトリ構成（概要）

```text
src/
  background/     Service Worker
  popup/          拡張機能 Popup UI
  sidepanel/      サイドパネル UI
  options/        設定画面
  services/       HTTP / es: / storage / credential vault
  models/         型定義
  utils/          整形・案内文など
tests/            Vitest
public/           manifest / icons
```

## トラブルシューティング

| 症状 | 確認すること |
|------|----------------|
| 接続できない | Everything 起動、HTTP Server 有効化、ポート一致 |
| 1.5 で接続できない | HTTP Server プラグインの導入・有効化 |
| 認証エラー | 設定画面で認証情報を保存し、パスフレーズでロック解除 |
| 「Everything で開く」が動作しない | `es:` プロトコルの有効化、Chrome の外部アプリ確認 |
| 結果が 0 件 | 検索文字列・オプションを確認（エラーではありません） |

## 既知の制約

- ローカルファイルを拡張機能から直接開けません
- 初期版の接続先は `localhost` / `127.0.0.1` のみです
- `es:` 起動時に Chrome の確認ダイアログが出る場合があります
- マスターパスフレーズを忘れると保存済み認証情報は復元できません

## Chrome Web Store 公開前の確認事項

- 不要な権限がないこと
- プライバシーポリシー（本リポジトリの `PRIVACY.md`）を公開 URL で提示できること
- Everything の別途インストールが必要なことをストア説明に明記すること
- 商標免責（非公式・voidtools 非提携）をストア説明に含めること
- 難読化・外部 CDN 読み込みがないこと
- 配布 zip は `npm run build:store` でビルドし、ソースマップを含めないこと
- ビルド手順が再現可能であること

## リポジトリ

- GitHub: https://github.com/Byosoku-Labs/find-in-everything
- Organization: https://github.com/Byosoku-Labs
- Privacy policy: https://github.com/Byosoku-Labs/find-in-everything/blob/develop/PRIVACY.md

## セキュリティ報告

脆弱性の報告方法は [`SECURITY.md`](./SECURITY.md) を参照してください。  
https://github.com/Byosoku-Labs/find-in-everything/security/advisories

## ライセンス

MIT License（`LICENSE`）

---

# Find in Everything (English)

A Chrome extension that sends selected text to the **Everything** HTTP Server (fast Windows file search) and shows results in the Popup or Side Panel.

Developed by Byosoku Labs.

> Find in Everything is an independent, unofficial browser extension.
> It is not affiliated with, endorsed by, or sponsored by voidtools.
> Everything is a trademark of its respective owner.

**Everything itself must be installed separately.** This extension does not use a Native Messaging Host or a custom background app.

## Features

- Search Everything from selected text via the context menu
- When nothing is selected, search using the page title
- Context-menu search results open in the Chrome Side Panel
- Advanced search in the extension Popup and Chrome Side Panel
- Search options (case / path / regex / sort order)
- Open Everything via the `es:` URL protocol
- Connection test for Everything HTTP Server
- Optional HTTP Basic auth (persisted with a master passphrase + AES-GCM)

## Screenshots

(Add Popup, Side Panel, Options, and context-menu screenshots before publication.)

## Requirements

- Google Chrome (Manifest V3)
- Windows
- Everything 1.4 or 1.5 (with HTTP Server available)
- Node.js 20 LTS or later (for development and builds)

## Install (development build)

### 1. Install dependencies

```bash
npm install
```

### 2. Build

```bash
npm run build
```

Output is written to `dist/`.

### 3. Load in Chrome

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist` folder in this repository

## Everything setup

### Everything 1.4 (recommended / default guidance)

1. Start Everything
2. **Tools → Options → HTTP Server**
3. Enable **HTTP Server**
4. Confirm the port (extension default is `8080`)
5. Optionally enable the `es:` URL protocol under General settings

You do not need to allow file downloads.

### Everything 1.5a / 1.5b

In the 1.5 line, HTTP Server is a plugin.

1. Start Everything 1.5
2. Install the HTTP Server plugin from [Plugins](https://www.voidtools.com/support/everything/plugins/) or [http_server releases](https://github.com/voidtools/http_server/releases)
3. Use **Add** in the installer, or place the DLL under `Everything\Plugins` and restart
4. Enable the HTTP Server as in 1.4 and match the port
5. Optionally enable the `es:` URL protocol

### Security notes

- Prefer running the HTTP Server on **localhost only**
- Exposing it on a LAN may reveal the search index to other devices
- On localhost, leaving username/password empty is recommended
- When using auth, the extension encrypts credentials with a master passphrase (8+ characters) and does not store the passphrase itself
- After unlock, credentials are kept temporarily in the session and auto-lock after about 30 minutes
- Search results are shown only inside the Popup or Side Panel extension pages; they are not injected into web page DOM
- Default host permissions cover port `8080` only; other ports require an additional grant when saving settings

## Permissions

| Permission | Purpose |
|------|------|
| `contextMenus` | Context menu for selected text |
| `storage` | Persist settings, search state, and encrypted credentials |
| `sidePanel` | Side Panel UI |
| `clipboardWrite` | Copy full paths |
| `alarms` | Auto-lock unlocked HTTP credentials |
| `http://localhost:8080/*` / `http://127.0.0.1:8080/*` | Search the default Everything HTTP Server port |
| (optional) `http://localhost:<port>/*`, etc. | Requested when saving/testing a non-8080 port in Options |

No Native Host. The extension does not open or download local files directly.

## Development

```bash
npm install
npm test
npm run build
npm run build:store
npm run lint
```

`npm run build:store` produces a distribution build without source maps.

### Directory layout (overview)

```text
src/
  background/     Service Worker
  popup/          Extension Popup UI
  sidepanel/      Side Panel UI
  options/        Options page
  services/       HTTP / es: / storage / credential vault
  models/         Type definitions
  utils/          Formatting and guidance copy
tests/            Vitest
public/           manifest / icons
```

## Troubleshooting

| Symptom | Check |
|------|----------------|
| Cannot connect | Everything running, HTTP Server enabled, port matches |
| Cannot connect on 1.5 | HTTP Server plugin installed and enabled |
| Auth error | Save credentials in Options and unlock with the passphrase |
| “Open in Everything” does nothing | Enable `es:` protocol; check Chrome external-app prompts |
| 0 results | Review the query and options (not necessarily an error) |

## Known limitations

- Local files cannot be opened directly from the extension
- Initial release supports `localhost` / `127.0.0.1` only
- Chrome may show a confirmation dialog when launching via `es:`
- Forgetting the master passphrase means stored credentials cannot be recovered

## Chrome Web Store pre-publication checklist

- No unnecessary permissions
- Privacy policy (`PRIVACY.md` in this repository) available at a public URL
- Store listing states that Everything must be installed separately
- Trademark disclaimer (unofficial / not affiliated with voidtools) included in the listing
- No obfuscation or external CDN loads
- Distribution zip built with `npm run build:store` and without source maps
- Build steps are reproducible

## Repository

- GitHub: https://github.com/Byosoku-Labs/find-in-everything
- Organization: https://github.com/Byosoku-Labs
- Privacy policy: https://github.com/Byosoku-Labs/find-in-everything/blob/develop/PRIVACY.md

## Security reports

See [`SECURITY.md`](./SECURITY.md) for how to report vulnerabilities.  
https://github.com/Byosoku-Labs/find-in-everything/security/advisories

## License

MIT License (`LICENSE`)
