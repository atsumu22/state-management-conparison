# やさしい交換日記 - 開発タスク一覧

## タスク一覧

| # | タスク | フェーズ | 状態 |
|---|--------|---------|------|
| 1 | Next.jsプロジェクトのセットアップ | 基盤 | [ ] |
| 2 | Supabase スキーマのマイグレーション作成 | 基盤 | [ ] |
| 3 | 認証機能（ログイン・新規登録）の実装 | Phase 2 | [ ] |
| 4 | パートナー招待機能の実装 | Phase 2 | [ ] |
| 5 | カレンダービューの実装 | Phase 1 | [ ] |
| 6 | 日記作成・編集モーダルの実装 | Phase 1 | [ ] |
| 7 | 日記帳ビュー（トップ・月別詳細）の実装 | Phase 1 | [ ] |
| 8 | スタンプ機能の実装 | Phase 1 | [ ] |
| 9 | 設定画面の実装 | Phase 2 | [ ] |
| 10 | スワイプナビゲーションの実装 | Phase 1 | [ ] |

---

## 依存関係

```
#1 Next.jsプロジェクトのセットアップ
  └─ #2 Supabase スキーマのマイグレーション作成
       ├─ #3 認証機能（ログイン・新規登録）
       │    └─ #4 パートナー招待機能
       │         └─ #5 カレンダービュー
       │              ├─ #6 日記作成・編集モーダル
       │              ├─ #7 日記帳ビュー（トップ・月別詳細）
       │              │    └─ #8 スタンプ機能
       │              └─ #9 設定画面
       └─ #10 スワイプナビゲーション（#5, #7 実装後に統合）
```

---

## タスク詳細

### #1 Next.jsプロジェクトのセットアップ

**概要:** やさしい交換日記の Next.js プロジェクトを初期化する。

**作業内容:**
- [ ] `npx create-next-app@latest` でプロジェクト作成（App Router + TypeScript）
- [ ] 必要なパッケージをインストール
  - `@supabase/supabase-js`, `@supabase/ssr`
  - `lucide-react`
  - `framer-motion`
- [ ] Tailwind CSS の設定（Noto Serif JP / Noto Sans JP フォント設定含む）
- [ ] `lib/supabase.ts`（Supabase クライアント設定）の作成
- [ ] `.env.local.example` の作成（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）
- [ ] `types/database.ts`（TypeScript 型定義）の作成

---

### #2 Supabase スキーマのマイグレーション作成

**概要:** `supabase_schema.md` の内容を元に Supabase マイグレーションファイルを作成する。

**作業内容:**
- [ ] `supabase/migrations/001_initial_schema.sql` の作成
  - `profiles` テーブル（ユーザープロフィール）
  - `diary_entries` テーブル（日記エントリ、UNIQUE(user_id, diary_date)）
  - `stamps` テーブル（スタンプ）
- [ ] RLS（Row Level Security）ポリシーの設定
- [ ] トリガー関数の作成
  - `update_updated_at_column()` - updated_at 自動更新
  - `handle_new_user()` - 新規ユーザー登録時のプロフィール自動作成
  - `set_published_at()` - 翌月1日の公開日時を自動設定
- [ ] `my_and_partner_diaries` ビューの作成
- [ ] `supabase/migrations/002_invite_codes.sql` の作成（招待コードテーブル）

---

### #3 認証機能（ログイン・新規登録）の実装

**概要:** Supabase Auth を使ったログイン・新規登録画面を実装する。

**参考:** `exchange_diary_app.tsx` の `LoginView` / `SignupView`

**作業内容:**
- [ ] `app/(auth)/login/page.tsx` の作成
- [ ] `app/(auth)/signup/page.tsx` の作成
- [ ] Supabase Auth の `signInWithPassword` / `signUp` の実装
- [ ] フォームバリデーション（必須チェック、パスワード最小文字数）
- [ ] エラーメッセージの表示
- [ ] ログイン後はカレンダービュー（`/`）へリダイレクト
- [ ] 認証状態に応じたルートガード（`middleware.ts`）
- [ ] デザイン: ローズ×ブルーのグラデーション

---

### #4 パートナー招待機能の実装

**概要:** 招待コードによるパートナーとのペアリング機能を実装する。

**参考:** `exchange_diary_app.tsx` の `InviteView`

**作業内容:**
- [ ] `app/(auth)/invite/page.tsx` の作成
- [ ] 招待コード生成ロジック
  - ランダム8文字英数字コードを生成して DB に保存
  - コードをコピーするボタン（Clipboard API）
  - 有効期限: 7日間
- [ ] 招待コード入力・接続ロジック
  - コードを検索して有効期限・未使用チェック
  - 双方向の `partner_id` を更新
  - `invite_codes` の `used_at` を更新
- [ ] 新規登録後は招待画面へ遷移
- [ ] パートナーが既に設定済みの場合はスキップ

---

### #5 カレンダービューの実装

**概要:** 今月のカレンダーを表示するメイン画面を実装する。

**参考:** `exchange_diary_app.tsx` の `CalendarView`

**作業内容:**
- [ ] `app/(app)/page.tsx` の作成（カレンダービュー）
- [ ] 今月のカレンダーグリッドを表示（曜日ヘッダー付き、日曜始まり）
- [ ] Supabase から今月の自分の日記一覧を取得
- [ ] 日付ごとの表示ロジック
  - 日記がある日: 自分のカラーの丸、タップで編集モーダル
  - 日記がない日: タップで新規作成モーダル
- [ ] 日記帳ボタン（📖）→ 日記帳ビューへ遷移
- [ ] 設定ボタン（⚙️）→ 設定画面へ遷移
- [ ] デザイン: ローズ×ブルーのグラデーション

---

### #6 日記作成・編集モーダルの実装

**概要:** 日記の書き込み・編集・削除を行うモーダル画面を実装する。

**参考:** `exchange_diary_app.tsx` の `WriteModal`

**作業内容:**
- [ ] `components/DiaryModal.tsx` の作成
- [ ] 新規作成モード
  - テキストエリア（400文字制限）
  - リアルタイム残り文字数表示（「あと◯◯文字書けます」）
  - 保存ボタン → Supabase INSERT
- [ ] 編集モード
  - 既存テキストを表示
  - 「🔒 ◯月1日に公開されます」表示
  - 編集ボタン → テキストエリアに切り替え → 保存 → Supabase UPDATE
  - 削除ボタン → 確認ダイアログ → Supabase DELETE
- [ ] ビジネスルール
  - 当月の日記のみ作成・編集・削除可能
  - 公開済み（`published_at` が過去）の場合は編集・削除ボタン非表示
  - 400文字を超える入力は不可
- [ ] 保存後はカレンダーの表示を更新

---

### #7 日記帳ビュー（トップ・月別詳細）の実装

**概要:** 公開済みの日記を月ごとに閲覧する日記帳ビューを実装する。

**参考:** `exchange_diary_app.tsx` の `DiaryListView` / `DiaryDetailView`

**作業内容:**
- [ ] `app/(app)/diary/page.tsx`（日記帳トップ）
  - 公開済み月の一覧と件数を取得（`published_at IS NOT NULL AND < 今月`）
  - 月ごとのカード表示（📔アイコン + 月名 + 件数）
  - カードタップ → 月別詳細へ
- [ ] `app/(app)/diary/[month]/page.tsx`（月別詳細）
  - `my_and_partner_diaries` ビューを使って対象月の日記を取得
  - 日付ごとにグループ化して時系列表示
  - 自分の日記: Noto Serif JP（明朝体）
  - パートナーの日記: Noto Sans JP（ゴシック体）
  - 日記の下にスタンプを表示
- [ ] デザイン
  - トップ: アンバー系のグラデーション
  - 詳細: 紙の質感（ベージュ系背景）、日付セパレーター

---

### #8 スタンプ機能の実装

**概要:** 公開済みパートナーの日記に絵文字スタンプを送る機能を実装する。

**参考:** `exchange_diary_app.tsx` のスタンプ部分

**作業内容:**
- [ ] `components/StampPicker.tsx` の作成
  - 絵文字一覧: ❤️ 👍 😊 🎉 💕 ✨ 🌸 ☕
  - 選択 → Supabase INSERT（`stamps` テーブル）
  - 既にスタンプがある場合は変更（DELETE + INSERT）
- [ ] スタンプ表示コンポーネント（「❤️ Bさん」形式）
- [ ] Supabase Realtime の購読設定
  - `stamps` テーブルの変更をリアルタイム受信
  - 日記詳細画面のスタンプ表示を自動更新
- [ ] ビジネスルール
  - パートナーの公開済み日記にのみスタンプ可能
  - 1つの日記に1スタンプのみ
  - 自分の日記にはスタンプ不可

---

### #9 設定画面の実装

**概要:** ユーザーの設定を管理する画面を実装する。

**参考:** `exchange_diary_app.tsx` の `SettingsView`

**作業内容:**
- [ ] `app/(app)/settings/page.tsx` の作成
- [ ] 名前の表示・編集
- [ ] カラー選択UI（6色）
  - `#f87171` (rose-400), `#60a5fa` (blue-400), `#34d399` (emerald-400)
  - `#a78bfa` (violet-400), `#fbbf24` (amber-400), `#fb923c` (orange-400)
  - 変更 → `profiles` テーブルの `color` を UPDATE
- [ ] パートナー情報（名前・カラー）の表示
- [ ] パートナー接続解除
  - 確認ダイアログ表示
  - 双方の `partner_id` を NULL に UPDATE
- [ ] ログアウト（Supabase `signOut` → ログイン画面へ）

---

### #10 スワイプナビゲーションの実装

**概要:** Framer Motion を使ったスワイプでの画面切り替えを実装する。

**作業内容:**
- [ ] `components/SwipeableView.tsx` の作成
  - Framer Motion の `useMotionValue`, `useTransform`, `animate` を使用
  - 左スワイプ → 日記帳ビューへ
  - 右スワイプ → カレンダービューへ
- [ ] カレンダービュー・日記帳ビューをラップするレイアウト設定
- [ ] スワイプ中のアニメーション（引っ張り → スナップ）
- [ ] ヒント表示（「← 日記帳を見る」「カレンダーに戻る →」）

---

## 開発フェーズまとめ

### Phase 1: MVP
- [x] タスク設計・ドキュメント整理
- [ ] #1 プロジェクトセットアップ
- [ ] #2 DB スキーマ
- [ ] #5 カレンダービュー
- [ ] #6 日記作成・編集モーダル
- [ ] #7 日記帳ビュー
- [ ] #8 スタンプ機能
- [ ] #10 スワイプナビゲーション

### Phase 2: 認証・ペアリング
- [ ] #3 認証機能
- [ ] #4 パートナー招待機能
- [ ] #9 設定画面

### Phase 3: 通知・改善（未設計）
- [ ] プッシュ通知（月末リマインダー、スタンプ通知）
- [ ] UX改善
- [ ] パフォーマンス最適化
