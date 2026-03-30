# やさしい交換日記 - CLAUDE.md

## このファイルについて

Claude Code（オーケストレーター）への開発指示書です。
サブエージェントを使った並行開発で、このアプリを構築してください。

---

## 前提条件（作業開始前に人間が用意するもの）

以下がすべて揃っていることを確認してから作業を開始すること。
揃っていない場合は**作業を止めて人間に通知**すること。

- [ ] Supabase ローカル環境が起動済み（`supabase start` で確認）
- [ ] `.env.local` に以下が設定済み
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `.gitignore` に `.env.local` が含まれていることを確認済み
- [ ] `supabase` CLI がインストール済み
- [ ] `gh`（GitHub CLI）がインストール済み

> ⚠️ `service_role key` は絶対に使用しないこと。`anon key` のみ使用すること。

---

## 参考ファイル

| ファイル | 用途 |
|---------|------|
| `yasashii_diary_requirements.md` | 要件定義（機能仕様・画面仕様） |
| `supabase_schema.md` | DBスキーマ・RLS・トリガー定義 |
| `exchange_diary_app.tsx` | UIモックアップ（デザイン参考） |
| `TODO.md` | タスク一覧と依存関係 |

---

## Git ルール

- 作業前に必ず `feature/task-{タスク番号}` ブランチを切ること
  - 例: `feature/task-01-nextjs-setup`
- コミットメッセージは日本語でOK、内容を簡潔に書くこと
- `.env.local` は**絶対にコミットしないこと**
  - 作業開始前に `.gitignore` に含まれているか必ず確認すること
- 実装完了後、別のサブエージェントにコードレビューを依頼すること
- レビュー指摘をすべて修正してから `gh pr create` でPRを作成すること

---

## コードレビュー観点

### 基本チェック（全PR共通）

サブエージェントにレビューを依頼する際は、以下を必ず確認すること：

- `supabase_schema.md` のRLSポリシーと実装が一致しているか
- ビジネスルール（400文字制限・公開日時・編集ロック）が実装されているか
- TypeScript の型エラーがないか（`tsc --noEmit` を実行して確認）
- テストが書かれており、すべてパスしているか
- `.env.local` やAPIキーがコードに含まれていないか

### 専門エージェントによる査読（統合フェーズ・重要PR）

以下のエージェントをプランファイルに対して実行し、YAML形式の査読結果を収集すること。
指摘された問題を修正してからPRを作成すること。

| エージェント | 指示ファイル | 査読観点 |
|------------|-------------|---------|
| Architect | `.claude/agents/review/code/architect.md` | Server/Client設計・レイヤリング・責務分離 |
| Security Expert | `.claude/agents/review/code/security-expert.md` | RLSバイパス・CVE対応・攻撃シナリオ |
| TDD Expert | `.claude/agents/review/code/tdd-expert.md` | テスト戦略・テスト容易性・t-wadaスタイル |
| Wizard Engineer | `.claude/agents/review/code/wizard-engineer.md` | エッジケース・タイムゾーン・文字数の罠 |
| Devils Advocate | `.claude/agents/review/common/devils-advocate.md` | 前提の妥当性・失敗シナリオ・隠れたコスト |
| Socratic Questioner | `.claude/agents/review/common/socratic-questioner.md` | 目的明確化・根拠探求・視点転換 |
| Strategic Thinker | `.claude/agents/review/common/strategic-thinker.md` | 目的と手段の整合性・優先順位・成功指標 |

**使い分けの目安**

- `review/code/` → 実装PR・設計レビュー時に毎回実行
- `review/common/` → 統合フェーズ・大きな方針判断時に実行
  - `devils-advocate`: 「このアプローチで本当に大丈夫か？」を問いたいとき
  - `socratic-questioner`: 「そもそもなぜこの機能が必要か？」を整理したいとき
  - `strategic-thinker`: 「フェーズ優先順位やMVP範囲を見直したい」とき

---

## テスト方針

### 使用ツール

| ツール | 用途 |
|--------|------|
| Vitest | ユニット・統合テスト |
| @testing-library/react | コンポーネントテスト |
| Playwright | E2Eテスト（Phase 3以降） |
| `tsc --noEmit` | 型チェック |

### ルール

- ビジネスロジックには**必ずユニットテストを書くこと**
- テストファイルは実装ファイルと同じディレクトリに配置すること
  - 例: `lib/diary.ts` → `lib/diary.test.ts`
- **TDDで進めること**（テストを書いてから実装する）
- テストが通るまでサブエージェントは自律的に修正すること

### カバレッジ基準

- ビジネスロジック: **90%以上**
- コンポーネント: **70%以上**

### 必須テストケース

以下は必ずテストすること：

```
published_at の計算
  - diary_date が 1月15日 → published_at が 2月1日 00:00:00
  - diary_date が 1月31日 → published_at が 2月1日 00:00:00
  - diary_date が 12月31日 → published_at が 翌年1月1日 00:00:00

バリデーション
  - 400文字を超えたら保存できないこと
  - 同じ日に2つ目の日記を作成できないこと

編集ロック
  - published_at が過去の日記は編集できないこと
  - published_at が過去の日記は削除できないこと

スタンプ
  - 自分の日記にはスタンプできないこと
  - パートナーの未公開日記にはスタンプできないこと
  - 1つの日記に同じユーザーが2つスタンプできないこと

RLS（Supabase ローカル環境で実行）
  - パートナーの未公開日記が見えないこと
  - 他人の日記を編集・削除できないこと
  - パートナー以外のユーザーの日記が見えないこと
```

---

## タスク実行戦略

TODO.md の依存関係に従い、以下のフェーズで並行開発すること。

### フェーズ 1（並行実行）

以下を**同時に**サブエージェントへ委譲する：

| タスク | 内容 | ブランチ |
|--------|------|----------|
| #1 | Next.js プロジェクトのセットアップ | `feature/task-01-nextjs-setup` |
| #2 | Supabase マイグレーションファイルの作成 | `feature/task-02-supabase-schema` |

フェーズ1完了条件：
- `npm run dev` でエラーなく起動すること
- `supabase db push` でマイグレーションが適用されること
- 全テストがパスすること

---

### フェーズ 2（フェーズ 1 完了後、並行実行）

以下を**同時に**サブエージェントへ委譲する：

| タスク | 内容 | ブランチ |
|--------|------|----------|
| #3 | 認証機能（ログイン・新規登録） | `feature/task-03-auth` |
| #5 | カレンダービュー | `feature/task-05-calendar` |
| #7 | 日記帳ビュー（トップ・月別詳細） | `feature/task-07-diary-list` |
| #9 | 設定画面 | `feature/task-09-settings` |

---

### フェーズ 3（フェーズ 2 完了後、並行実行）

以下を**同時に**サブエージェントへ委譲する：

| タスク | 内容 | ブランチ |
|--------|------|----------|
| #4 | パートナー招待機能 | `feature/task-04-invite` |
| #6 | 日記作成・編集モーダル | `feature/task-06-diary-modal` |
| #8 | スタンプ機能 | `feature/task-08-stamps` |

---

### 統合フェーズ（フェーズ 3 完了後）

| タスク | 内容 | ブランチ |
|--------|------|----------|
| #10 | スワイプナビゲーションの統合・全体動作確認 | `feature/task-10-swipe` |

統合完了条件：
- 全フィーチャーブランチが main にマージ済みであること
- `npm run build` がエラーなく通ること
- E2E テスト（ログイン→日記作成→公開の一連フロー）がパスすること

---

### リリース前監査（統合フェーズ完了後）

統合フェーズが完了したら、以下のエージェントを実行すること。

| エージェント | 指示ファイル | 実行タイミング |
|-------------|-------------|---------------|
| リスク監査 | `.claude/agents/risk-audit.md` | リリース判断の直前 |

**重要:** リスク監査エージェントの出力にある 🔴 項目は、
人間が専門家に確認するまでリリースを保留すること。

---

## Next.js 設計原則

### Server Component / Client Component の使い分け

- デフォルトは **Server Component**（`"use client"` を不用意につけない）
- `"use client"` をつけるのは以下の場合のみ
  - `useState` / `useReducer` を使う
  - `useEffect` を使う
  - `onClick` などのイベントハンドラを使う
  - ブラウザAPIを使う（`window`, `localStorage` など）
  - Supabase Realtime を購読する（スタンプのリアルタイム更新）
- Supabase へのデータ取得（SELECT）は **Server Component** で行う
- 作成・更新・削除は **Server Actions** を使う

Railsで例えると：
```
Server Component  = Controller + View（サーバーで完結）
Client Component  = ブラウザ上のJS（フォーム・アニメーション）
Server Actions    = form_with の POST アクション
middleware.ts     = before_action（認証ガード）
lib/              = concerns/ やサービスクラス
components/       = partial
```

---

### ディレクトリ構成

```
app/
├── (auth)/             # 認証不要ページ（ログイン・新規登録・招待）
│   ├── login/
│   ├── signup/
│   └── invite/
├── (app)/              # 認証必須ページ
│   ├── page.tsx        # カレンダービュー（トップ）
│   ├── diary/          # 日記帳ビュー
│   └── settings/       # 設定画面
├── actions/            # Server Actions（DB への書き込み処理）
│   ├── diary.ts        # 日記の作成・更新・削除
│   ├── stamp.ts        # スタンプの追加・削除
│   └── profile.ts      # プロフィール更新・パートナー設定
└── lib/                # ユーティリティ・ビジネスロジック
    ├── supabase.ts     # Supabase クライアント
    ├── diary.ts        # 日記関連のロジック（published_at 計算など）
    └── utils.ts        # 汎用ユーティリティ

components/
├── ui/                 # 汎用UIコンポーネント（Button, Modal など）
└── features/           # 機能単位のコンポーネント
    ├── calendar/       # カレンダー関連
    ├── diary/          # 日記モーダル・日記帳
    └── stamp/          # スタンプピッカー
```

---

### データ取得の原則

```
参照（SELECT）
  → Server Component で直接 Supabase を呼ぶ
  → props でクライアントに渡す

作成・更新・削除（INSERT / UPDATE / DELETE）
  → app/actions/ に Server Actions として定義する
  → フォームや onClick から呼び出す

リアルタイム更新（スタンプ）
  → Client Component + Supabase Realtime で購読
```

---

### やってはいけないこと

- Server Component の中で `useState` / `useEffect` を使う
- Client Component の中で Supabase の秘密キーを使う
- `page.tsx` に直接ビジネスロジックを書く（`lib/` に切り出す）
- `any` 型を使う（`unknown` で受けて型ガードする）
- `useEffect` でデータ取得する（Server Component で取得する）

---

## 禁止事項

- `service_role key` の使用
- `.env.local` のコミット
- テストなしでの PR 作成
- 前提条件が揃っていない状態での作業開始
- `main` ブランチへの直接コミット
