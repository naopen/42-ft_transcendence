# Remote Multiplayer Setup Guide

## 🚀 Quick Start (HTTPS Default)

ft_transcendenceは**HTTPS**をデフォルトとし、**ngrok**を標準とします。

### 基本コマンド（推奨）
```bash
# HTTPS リモートマルチプレイヤーで起動（デフォルト）
make

# または明示的に
make ngrok
```

このコマンドが自動実行する内容：
- ✅ **ngrokの自動インストール**（`brew install ngrok`）
- ✅ **認証トークンの自動設定**
- ✅ **Dockerコンテナのビルド・起動**
- ✅ **HTTPS ngrokトンネルの作成**
- ✅ **公開URLの表示**

### 開発モード（HTTPのみ・ローカル）
```bash
# ローカル開発のみ（HTTPS無し）
make dev
```

## 🎯 評価要件への対応

### ✅ 必須要件
- **別々の2つのPCでプレイ**: ngrokにより異なるネットワークから接続可能
- **ngrok無料プラン対応**: 1つのポート（8080）のみ使用
- **Google OAuth対応**: ngrok HTTPSドメインでの認証
- **HTTPS必須**: ngrokが自動的にHTTPS化

### 🔧 自動化された機能
1. **ngrok自動インストール**: システムにngrokがない場合、自動でインストール
2. **認証自動設定**: 事前設定された認証トークンで自動設定
3. **HTTPS自動化**: ngrokが自動的にHTTPS終端を処理
4. **URL自動更新**: .envファイルが自動的に更新

## 📋 使用方法

### 1. 基本起動（評価推奨）
```bash
make
```

期待される出力：
```
🚀 ft_transcendence with ngrok (HTTPS)
📦 Building and starting containers...
✅ Application containers running!
🔌 Setting up ngrok tunnel...
📦 Installing ngrok...  # 初回のみ
🔑 Configuring ngrok authentication...  # 初回のみ
🔌 Starting ngrok tunnel on port 8080...
🔍 Getting ngrok tunnel URL...
✅ Updated .env file with ngrok URL

🎉 ngrok tunnel is ready!

🌐 Public Access URL:
   https://abc123.ngrok.io

🎮 Share this URL for remote multiplayer:
   https://abc123.ngrok.io
```

### 2. Google OAuth設定
表示されたngrok URLを使用してGoogle Cloud Consoleを設定：

1. **Google Cloud Console**にアクセス
2. **APIs & Services > Credentials**
3. **OAuth 2.0 Client ID**を選択
4. **リダイレクトURIを追加**:
   ```
   https://abc123.ngrok.io/api/auth/google/callback
   ```
5. **保存**してアプリケーションを再起動

### 3. マルチプレイヤーテスト
- 表示されたngrok URLを他のプレイヤーと共有
- 異なるネットワーク、異なるISPからでもアクセス可能
- モバイルデバイスからもアクセス可能

## 🌐 アーキテクチャ

### ngrok HTTPS 方式（デフォルト）
```
Internet ←→ ngrok.io (HTTPS) ←→ ngrok client ←→ nginx:8080 ←→ Frontend:5173
                                                             ←→ Backend:3000
```

**メリット**：
- 🌍 **真のリモートアクセス**: インターネット経由でどこからでもアクセス
- 🔒 **自動HTTPS**: ngrokが自動的にSSL終端を処理
- 🚫 **ファイアウォール不要**: NAT/ファイアウォール設定が不要
- 💰 **無料**: ngrok無料プランで十分
- ⚡ **自動設定**: 手動設定が一切不要

### ローカル開発方式（開発のみ）
```
localhost:8080 ←→ nginx ←→ Frontend:5173
                        ←→ Backend:3000
```

**用途**: 開発・デバッグのみ（リモートアクセス不可）

## 🔧 詳細コマンド

```bash
# メインコマンド
make            # ngrok HTTPS起動（デフォルト）
make ngrok      # 明示的にngrok起動
make re         # 完全リビルド + ngrok起動

# 開発コマンド
make dev        # ローカル開発（HTTP）
make build      # コンテナビルドのみ
make down       # コンテナ停止

# ユーティリティ
make logs       # ログ表示
make status     # コンテナ状態確認
make health     # ヘルスチェック
make stop-ngrok # ngrokトンネル停止
```

## 🚨 トラブルシューティング

### ngrok関連
- **「ngrok not found」**: 自動インストールされるはずですが、手動で`brew install ngrok`
- **「authentication failed」**: 認証トークンが自動設定されるはずですが、手動設定も可能
- **「tunnel expired」**: `make stop-ngrok`してから`make ngrok`で再起動

### OAuth関連
- **「redirect_uri_mismatch」**: Google Cloud Consoleでngrok URLを追加
- **「invalid client」**: .envファイルのGoogle OAuth認証情報を確認

### アプリケーション関連
- **「containers not starting」**: `make down`してから`make`で再起動
- **「WebSocket connection failed」**: ngrokトンネルが正常に起動しているか確認

## 🎮 ゲーム機能

### リモートマルチプレイヤー
- **真のインターネット接続**: 世界中どこからでもアクセス可能
- **リアルタイム通信**: WebSocket over HTTPS (WSS)
- **クロスプラットフォーム**: PC、モバイル対応

### 3D Pong（Babylon.js）
- リアルタイムマルチプレイヤー
- スムーズな3Dレンダリング
- レスポンシブ設計

### その他機能
- **統計ダッシュボード**: 詳細な戦績追跡
- **多言語対応**: 英語・日本語・フランス語
- **トーナメントシステム**: ローカル大会機能

## 📝 評価チェックリスト

- ✅ **HTTPS対応**: ngrokによる自動HTTPS
- ✅ **リモートマルチプレイヤー**: インターネット経由での対戦
- ✅ **2台の異なるPC**: 異なるネットワークからの接続
- ✅ **自動URL表示**: `make`実行時に自動表示
- ✅ **Google OAuth**: ngrok HTTPSドメインでの認証
- ✅ **単一ポート**: ngrok無料プラン対応（ポート8080のみ）
- ✅ **自動化**: ngrokインストール・設定の完全自動化

## 🏆 評価実行方法

```bash
# 1. プロジェクトディレクトリに移動
cd /path/to/ft_transcendence

# 2. 起動（すべて自動）
make

# 3. 表示されたngrok URLを使用してマルチプレイヤーテスト
# 4. Google OAuth設定（表示される手順に従う）
# 5. 評価完了！
```

**注意**: 初回実行時はngrokのインストールと設定で少し時間がかかる場合があります。

---

**ft_transcendence: 真のリモートマルチプレイヤー対応完了 🎉**
