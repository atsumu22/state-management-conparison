# CLAUDE.md — state-management-comparison

## プロジェクト概要

Railsの `enum` による状態管理と、37signalsが採用している「関連レコードの有無」による状態管理を比較検証するサンプルアプリ。技術ブログの検証用途のため、**シンプルさを最優先**とする。

詳細な仕様は `requirements.md` を参照すること。

---

## 技術スタック

- Ruby on Rails（API不要、モデル層のみ）
- SQLite（開発・検証用途のため）
- RSpec（使用しない。検証はRails Consoleスクリプトで行う）

---

## 実装フェーズ

### Phase 1: 公開機能（先に完成させること）

**Agent A — Migration**
1. 以下の3マイグレーションファイルを作成する
   - `create_article_with_enums`
   - `create_article_with_relations`
   - `create_article_publications`
2. `rails db:migrate` を実行する
3. `schema.rb` を確認し、テーブルとインデックスが正しく作成されていることを報告する

**Agent B — Models**
Agent A の完了を確認してから着手する。
1. `app/models/article_with_enum.rb` を実装する
2. `app/models/article_with_relation.rb` を実装する
3. `app/models/article_publication.rb` を実装する

**Agent C — 検証**
Agent B の完了を確認してから着手する。
1. `requirements.md` セクション5・Phase 1 のスクリプトを Rails Console で実行する
2. 全出力結果をそのまま報告する
3. エラーがあれば Agent B に差し戻す

---

### Phase 2: アーカイブ機能（Phase 1 完了後に着手）

**Agent A — Migration**
1. 以下の2マイグレーションファイルを作成する
   - `add_archive_columns_to_article_with_enums`（`archived_at`, `archiver_id` を追加）
   - `create_article_archives`
2. `rails db:migrate` を実行する
3. `schema.rb` の差分を報告する（`article_with_enums` にカラムが追加されていること、`article_archives` テーブルが新規作成されていることを確認）

**Agent B — Models**
Agent A の完了を確認してから着手する。
1. `app/models/article_with_enum.rb` に `archive!` メソッドを追記する
2. `app/models/article_with_relation.rb` に `has_one :article_archive` / `archive!` / `archived?` / `scope :archived` を追記する
3. `app/models/article_archive.rb` を新規作成する

**Agent C — 検証**
Agent B の完了を確認してから着手する。
1. `requirements.md` セクション5・Phase 2 のスクリプトを Rails Console で実行する
2. 全出力結果をそのまま報告する（二重アーカイブ時の `RecordNotUnique` エラーも含む）
3. エラーがあれば Agent B に差し戻す

---

## 実装ルール（必ず守ること）

### やること
- モデルのロジックはモデルファイルに直接記述する
- `article_publications` と `article_archives` の Unique Index は必ず設定する
- `archive!` メソッド内では `transaction` を使い、`article_publication&.destroy` を先に実行してから `create_article_archive!` を呼ぶ（公開中かつアーカイブ済みの矛盾防止）
- バリデーションは `title` の `presence: true` のみ

### やらないこと
- Concern は使用しない
- User モデルは作成しない（検証スクリプトで `Struct.new(:id).new(1)` で代替）
- RSpec / テストファイルは作成しない
- 状態遷移の履歴管理（`histories` テーブル）はスコープ外
- コントローラー・ビューは作成しない

---

## 既知のトレードオフ（実装判断の参考）

- `ArticleWithRelation` は `article_publication` がないと状態を答えられない。これは設計意図（責務の分離）であり、修正不要
- 状態の排他（公開中かつアーカイブ済みの防止）はDBではなく `archive!` のトランザクションで担保する
- 遷移履歴が必要な場合は `histories` テーブルを別途追加する設計に拡張できるが、今回はスコープ外

---

## 完了条件

- [ ] Phase 1: Rails Console スクリプトがエラーなく実行でき、出力結果が報告されている
- [ ] Phase 2: Rails Console スクリプトがエラーなく実行でき、`RecordNotUnique` エラーも確認されている
- [ ] `schema.rb` にて、`article_with_enums` に Phase 2 で `archived_at` / `archiver_id` が追加されていることが確認できる（Enumパターンの親テーブル肥大化の証拠として重要）
