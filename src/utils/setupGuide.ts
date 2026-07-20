export const CONNECTION_ERROR_GUIDE = `Everything HTTP Serverに接続できませんでした。

Everythingで以下を確認してください。

1. Everythingを起動する
2. ツール → オプション → HTTPサーバーを開く
3. HTTPサーバーを有効にする
4. ポート番号が拡張機能の設定と一致しているか確認する

ファイルのHTTPダウンロードを有効にする必要はありません。
HTTPサーバーはlocalhostのみで利用することを推奨します。

Everything 1.5 をお使いの場合は、HTTP Server プラグインが
インストール・有効化されているかも確認してください。`;

export const SETUP_GUIDE_14 = `Find in Everythingを使用するには、EverythingのHTTPサーバーを有効にしてください。

【Everything 1.4】

1. Everythingを起動する
2. ツール → オプション → HTTPサーバーを開く
3. HTTPサーバーを有効にする
4. ポート番号を確認する（初期値の例: 8080）
5. 必要に応じて、全般設定から es: URLプロトコルを有効にする

ファイルのダウンロードを許可する必要はありません。
HTTPサーバーはlocalhostのみで利用することを推奨します。
localhost利用時は、HTTPサーバーのユーザー名/パスワードを空にすることを推奨します。`;

export const SETUP_GUIDE_15 = `Find in Everythingを使用するには、Everything 1.5 のHTTP Serverプラグインを導入し、HTTPサーバーを有効にしてください。

【Everything 1.5a / 1.5b】

1. Everything 1.5 を起動する
2. HTTP Server プラグインを導入する
   - voidtools の Plugins ページ、または GitHub の http_server releases から入手
   - インストーラーを実行し Add する
   - または zip から DLL を Everything インストール先\\Plugins へ配置し、Everything を完全終了して再起動
3. 必要なら ツール → オプション → プラグイン で HTTP Server が有効か確認する
4. ツール → オプション → HTTPサーバーを開く
5. HTTPサーバーを有効にする
6. ポート番号を確認する（初期値の例: 8080）
7. 必要に応じて、全般設定から es: URLプロトコルを有効にする

ファイルのダウンロードを許可する必要はありません。
HTTPサーバーはlocalhostのみで利用することを推奨します。`;

export const ES_PROTOCOL_NOTE =
  "Chromeで外部アプリケーションを開く確認ダイアログが表示される場合があります。es: URLプロトコルが未登録の場合は、Everythingの全般設定から有効化してください。";

export const LOCALHOST_SECURITY_NOTE =
  "Everything HTTP ServerをLANへ公開すると、検索インデックスの情報が他端末から見える可能性があります。localhostのみでの利用を推奨します。";
