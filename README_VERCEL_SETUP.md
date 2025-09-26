# Vercel環境変数設定ガイド

## 重要な環境変数設定

Vercelでこのアプリケーションをデプロイする際は、以下の環境変数を設定する必要があります。

### 必須の環境変数

1. **TWITTER_API_BASE_URL**
   - 説明: ツイート取得APIサーバーのベースURL
   - 例: `https://your-api-server.com` または `https://api.yourdomain.com`
   - **注意**: `http://localhost:3015` は本番環境では使用できません

2. **NEXT_PUBLIC_SUPABASE_URL**
   - 説明: SupabaseプロジェクトのURL
   - 例: `https://xxxxx.supabase.co`

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - 説明: Supabaseの匿名キー
   - 例: `eyJhbGci...`

4. **SUPABASE_SERVICE_ROLE_KEY**
   - 説明: Supabaseのサービスロールキー（サーバーサイド処理用）
   - 例: `eyJhbGci...`

## Vercelでの設定手順

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. "Settings" タブをクリック
4. "Environment Variables" セクションに移動
5. 以下の環境変数を追加:

```
TWITTER_API_BASE_URL = https://your-actual-api-server.com
NEXT_PUBLIC_SUPABASE_URL = your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
```

6. "Save" をクリック
7. デプロイを再実行

## APIサーバーの要件

`TWITTER_API_BASE_URL` に設定するAPIサーバーは以下の要件を満たす必要があります:

- HTTPSで公開されていること（本番環境）
- `/api/latest-tweets` エンドポイントが利用可能
- CORS設定が適切に行われていること
- 以下のクエリパラメータをサポート:
  - `screen_name`: Twitterユーザー名
  - `count`: 取得するツイート数

## トラブルシューティング

### エラー: "TWITTER_API_BASE_URL環境変数が設定されていません"
- Vercelの環境変数設定を確認してください
- デプロイを再実行してください

### エラー: "本番環境でlocalhostは使用できません"
- `TWITTER_API_BASE_URL` を実際のAPIサーバーのURLに変更してください

### エラー: "APIサーバーに接続できません"
- APIサーバーが正常に動作していることを確認
- URLが正しいことを確認
- HTTPS証明書が有効であることを確認

## ローカル開発環境

ローカル開発時は `.env.local` ファイルに以下を設定:

```
TWITTER_API_BASE_URL=http://localhost:3015
```

これにより、ローカルで動作するAPIサーバーに接続できます。