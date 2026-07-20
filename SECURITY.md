# セキュリティポリシー

リポジトリ: https://github.com/Byosoku-Labs/find-in-everything

## サポート対象バージョン

セキュリティ修正は、本リポジトリの最新の `develop` / リリース用コミットに適用します。過去にパッケージ化したビルドを個別にパッチすることはありません。新しいビルドへ更新してください。

## 脆弱性の報告

可能であれば、セキュリティ問題は非公開で報告してください。優先順位は次のとおりです。

1. **GitHub Security Advisory（推奨）**  
   https://github.com/Byosoku-Labs/find-in-everything/security/advisories/new
2. **GitHub Issues（悪用手順の詳細は書かない）**  
   https://github.com/Byosoku-Labs/find-in-everything/issues  
   非公開チャネルを依頼してください。攻撃者の助けになる手順は公開しないでください。
3. **Chrome ウェブストア掲載ページのサポート**（公開後）  
   掲載ページのサポートチャネルから Byosoku Labs へ連絡してください。

組織: https://github.com/Byosoku-Labs

報告には次を含めてください。

- 影響するコミットまたは拡張機能のバージョン
- 再現手順
- 影響範囲（例: 認証情報の露出、意図しないホストへのアクセス）

妥当な期間内での受領確認を目指し、修正後に開示の調整を行います。

## スコープに関する注記

- 本拡張機能が通信するのは、ユーザーが設定した Everything HTTP Server（localhost / 127.0.0.1）のみです
- ホスト権限の既定はポート `8080` です。他ポートは明示的な任意権限の許可が必要です
- ロック解除済みの HTTP 認証情報はセッションストレージに限定時間のみ保持され、自動ロック用アラームにより消去されます

## 関連ドキュメント

- プライバシーポリシー: https://github.com/Byosoku-Labs/find-in-everything/blob/develop/PRIVACY.md
- ソースコード: https://github.com/Byosoku-Labs/find-in-everything

---

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
