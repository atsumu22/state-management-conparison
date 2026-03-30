# やさしい交換日記 - セットアップガイド（人間の作業）

Devcontainer内ではDockerが使えないため、Supabase Cloud（無料）を使います。
以下の手順を上から順にやってください。所要時間は5〜10分です。

---

## Step 1: Supabase アカウント作成 & プロジェクト作成

1. **https://supabase.com** にアクセスし「Start your project」をクリック
2. GitHubアカウントでサインアップ（一番楽です）
3. ログイン後、「New Project」をクリック
4. 以下を入力：
   - **Organization**: デフォルトでOK
   - **Project name**: `yasashii-diary`（何でもOK）
   - **Database Password**: 好きなパスワード（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択
5. 「Create new project」をクリックして数分待つ

---

## Step 2: API URL と anon key をコピー

プロジェクトが作成されたら：

1. 左メニュー「Project Settings」（歯車アイコン）をクリック
2. 「API」をクリック
3. 以下の2つをコピー：
   - **Project URL**（例: `https://xxxxx.supabase.co`）
   - **Project API keys** の **anon / public** キー

> **service_role キーは絶対にコピーしないでください。使いません。**

---

## Step 3: Devcontainerで以下を実行

Claudeに以下の形式で値を伝えてください：

```
準備できた
URL: https://xxxxx.supabase.co
ANON_KEY: eyJxxxxxxxxxxxx
```

Claudeが `.env.local` の作成、`supabase init`、`supabase link` を自動で行います。

---

## 確認チェックリスト

- [ ] Supabase アカウント作成済み
- [ ] プロジェクト作成済み（リージョン: Tokyo）
- [ ] Project URL をコピー済み
- [ ] anon key をコピー済み
- [ ] Claudeに値を伝えた

---

## 補足: 無料プランの制限

開発用途では全く問題ありません：
- プロジェクト数: 2つまで
- DBストレージ: 500MB
- 認証ユーザー: 50,000 MAU
- 7日間操作がないと自動停止（再開はダッシュボードからワンクリック）
