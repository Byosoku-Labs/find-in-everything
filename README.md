# Find in Everything

選択した文字列を Windows 向け高速ファイル検索ソフト **Everything** の HTTP サーバーへ送り、Chrome の Popup または Side Panel に結果を表示する拡張機能です。

Developed by Byosoku Labs.

> Find in Everything is an independent, unofficial browser extension.
> It is not affiliated with, endorsed by, or sponsored by voidtools.
> Everything is a trademark of its respective owner.

**Everything 本体の別途インストールが必要です。** Native Messaging Host や独自の常駐アプリは使用しません。

## 主な機能

- Web ページ上の選択文字列を右クリックから Everything で検索
- 未選択時はページタイトルで検索
- 右クリック検索は Chrome Side Panel で安全に結果を表示
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
- 解除後の認証情報はセッションに一時保持され、約30分で自動ロックされます
- 検索結果は Popup または Side Panel の拡張機能ページ内にのみ表示し、Web ページの DOM には挿入しません
- 既定のホスト権限はポート `8080` のみです。他ポートは設定保存時に追加許可が必要です
## 権限の説明

| 権限 | 用途 |
|------|------|
| `contextMenus` | 選択文字列の右クリックメニュー |
| `storage` | 設定・検索状態・暗号化認証情報の保存 |
| `sidePanel` | サイドパネル表示 |
| `clipboardWrite` | フルパスのコピー |
| `alarms` | 解除済み HTTP 認証の自動ロック |
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
| 認証エラー | 設定画面で認証情報を保存し、パスフレーズで解除 |
| Everythingで開くが動かない | `es:` プロトコルの有効化、Chrome の外部アプリ確認 |
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

## セキュリティ報告

脆弱性の報告方法は `SECURITY.md` を参照してください。

## ライセンス

MIT License（`LICENSE`）
