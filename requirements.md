# 要件定義書: State Management Comparison App

## 1. 開発の目的

Rails標準の enum による状態管理と、37signalsがFizzy等で採用している「関連レコードの有無」による状態管理を、最もシンプルな形で比較・検証するサンプルアプリを構築する。

### 設計思想の背景

37signalsの設計では、状態を単なるフラグではなく「関連レコードの有無」で表現する。これにより以下を実現する。

- DBレベルの制約活用（Unique Index による二重防止）
- 状態に付随するメタデータ（誰が・いつ）の自然な保持
- 親テーブルのクリーン化（"Everything is CRUD" の精神）

### 検証シナリオの設計方針

本アプリは「公開（published）」状態を初期実装として構築し、後から「アーカイブ（archived）」状態を追加するという2フェーズ構成で実装する。

この「後から追加する」シナリオを踏むことで、以下の差異がコードとマイグレーション履歴の上に具体的に現れる。

- **Enum パターン**: `archived_at` / `archiver_id` の2カラムを親テーブルに追加するマイグレーションが発生する
- **リレーション パターン**: `article_archives` テーブルを新規作成するだけで、親テーブルへの変更がゼロ

---

## 2. データベース設計

実装は Phase 1（公開機能）→ Phase 2（アーカイブ機能を後追い追加） の2段階で行う。

### Phase 1: 初期実装

#### A. `article_with_enums` テーブル（Enum パターン）

1つのテーブルにすべての状態と付随データを保持する。

| カラム名 | 型 | オプション |
|---|---|---|
| title | string | null: false |
| status | integer | default: 0, null: false |
| published_at | datetime | |
| publisher_id | bigint | |

#### B. `article_with_relations` テーブル（リレーション パターン）

状態に関するカラムを親テーブルに持たない。

| カラム名 | 型 | オプション |
|---|---|---|
| title | string | null: false |

#### C. `article_publications` テーブル（状態レコード: 公開）

「公開」という状態そのものをレコードとして表現する。

| カラム名 | 型 | オプション |
|---|---|---|
| article_with_relation_id | bigint | null: false, foreign key |
| publisher_id | bigint | null: false |
| created_at | datetime | ※公開日時として扱う |

必須インデックス: `index [:article_with_relation_id], unique: true`

### Phase 2: アーカイブ機能を後から追加

#### Enum パターン側に必要な変更（親テーブルへの追加マイグレーション）

`article_with_enums` テーブルに以下の2カラムを追加するマイグレーションが発生する。

| カラム名 | 型 | オプション |
|---|---|---|
| archived_at | datetime | |
| archiver_id | bigint | |

> **注意**: 状態が増えるたびに、無関係な記事レコードにも NULL カラムが追加される。

#### リレーション パターン側に必要な変更（新テーブルの追加のみ）

`article_with_relations` テーブルは一切変更しない。新たな状態テーブルを追加するだけ。

#### D. `article_archives` テーブル（状態レコード: アーカイブ）

「アーカイブ」という状態そのものをレコードとして表現する。

| カラム名 | 型 | オプション |
|---|---|---|
| article_with_relation_id | bigint | null: false, foreign key |
| archiver_id | bigint | null: false |
| reason | string | ※アーカイブ理由（メタデータの例示） |
| created_at | datetime | ※アーカイブ日時として扱う |

必須インデックス: `index [:article_with_relation_id], unique: true`

> **ポイント**: `reason` のようなメタデータも、親テーブルを汚さずにこのテーブルだけで完結する。

---

## 3. モデル実装要件

### Phase 1: 公開機能

#### 3.1 ArticleWithEnum

```ruby
# app/models/article_with_enum.rb
class ArticleWithEnum < ApplicationRecord
  enum :status, { draft: 0, published: 1, archived: 2 }

  validates :title, presence: true

  def publish!(user)
    update!(
      status: :published,
      published_at: Time.current,
      publisher_id: user.id
    )
  end
end
```

- 状態判定は `published?` など enum 自動生成メソッドで行う
- `publish!(user)` は `status` / `published_at` / `publisher_id` を同時更新する

#### 3.2 ArticleWithRelation

```ruby
# app/models/article_with_relation.rb
class ArticleWithRelation < ApplicationRecord
  has_one :article_publication, dependent: :destroy

  validates :title, presence: true

  scope :published, -> { joins(:article_publication) }

  def publish!(user)
    create_article_publication!(publisher_id: user.id)
  end

  def published?
    article_publication.present?
  end
end
```

- 状態判定は `article_publication.present?` で行う
- 検索は `joins(:article_publication)` による INNER JOIN で行う

#### 3.3 ArticlePublication

```ruby
# app/models/article_publication.rb
class ArticlePublication < ApplicationRecord
  belongs_to :article_with_relation, touch: true
end
```

### Phase 2: アーカイブ機能を後から追加

#### 3.4 ArticleWithEnum（変更あり）

`archive!(user)` メソッドと、それに伴うカラム更新を追加する。

```ruby
def archive!(user)
  update!(
    status: :archived,
    archived_at: Time.current,  # Phase 2 で追加したカラム
    archiver_id: user.id        # Phase 2 で追加したカラム
  )
end
```

> **注意**: マイグレーションで追加した `archived_at` / `archiver_id` を参照するため、モデルと DB の両方を変更する必要がある。

#### 3.5 ArticleWithRelation（変更あり）

`has_one :article_archive` とスコープ・メソッドを追記するだけ。

```ruby
has_one :article_archive, dependent: :destroy

scope :archived, -> { joins(:article_archive) }

def archive!(user, reason: nil)
  create_article_archive!(archiver_id: user.id, reason: reason)
end

def archived?
  article_archive.present?
end
```

> **ポイント**: 親テーブルのマイグレーションはゼロ。モデルに `has_one` と数メソッドを追記するだけ。

#### 3.6 ArticleArchive（新規追加）

```ruby
# app/models/article_archive.rb
class ArticleArchive < ApplicationRecord
  belongs_to :article_with_relation, touch: true
end
```

---

## 4. ファイル構成

Concern を排除し、トップレベルのモデルのみで構成する。

```
app/models/
├── article_with_enum.rb        # Enum 管理の全ロジック（Phase 2 で archive! を追記）
├── article_with_relation.rb    # リレーション管理の親ロジック（Phase 2 で has_one 追記）
├── article_publication.rb      # 「公開中」を表す状態モデル（Phase 1）
└── article_archive.rb          # 「アーカイブ済み」を表す状態モデル（Phase 2 で新規追加）
```

`db/migrate/` のファイル数が両パターンの違いを物語る。

```
# Enum パターン側の migrate ファイル（Phase 2 で親テーブルへの add_column が増える）
20240101_create_article_with_enums.rb
20240201_add_archive_columns_to_article_with_enums.rb  ← Phase 2 で追加

# リレーション パターン側の migrate ファイル（親テーブルは Phase 1 から変わらず）
20240101_create_article_with_relations.rb
20240101_create_article_publications.rb
20240201_create_article_archives.rb                    ← Phase 2 で追加（親テーブルは無変更）
```

---

## 5. 動作確認スクリプト（Rails Console）

### Phase 1: 公開機能

```ruby
user_id = 1

# --- Enum パターン ---
ae = ArticleWithEnum.create!(title: "Enum Post")
ae.publish!(Struct.new(:id).new(user_id))
puts "Enum status:       #{ae.status}"
puts "Enum published_at: #{ae.published_at}"
puts "Enum publisher_id: #{ae.publisher_id}"

# --- リレーション パターン ---
ar = ArticleWithRelation.create!(title: "Relation Post")
ar.publish!(Struct.new(:id).new(user_id))
puts "Relation published?:    #{ar.published?}"
puts "Relation published_at:  #{ar.article_publication.created_at}"
puts "Relation publisher_id:  #{ar.article_publication.publisher_id}"

# SQL 確認
puts ArticleWithRelation.published.to_sql
```

### Phase 2: アーカイブ機能（後追い追加）

```ruby
user_id = 1

# --- Enum パターン: archive! 呼び出し ---
ae = ArticleWithEnum.create!(title: "Enum Archive Test")
ae.archive!(Struct.new(:id).new(user_id))
puts "Enum status:       #{ae.status}"       # => "archived"
puts "Enum archived_at:  #{ae.archived_at}"  # Phase 2 で追加したカラム
puts "Enum archiver_id:  #{ae.archiver_id}"  # Phase 2 で追加したカラム

# --- リレーション パターン: archive! 呼び出し ---
ar = ArticleWithRelation.create!(title: "Relation Archive Test")
ar.archive!(Struct.new(:id).new(user_id), reason: "Outdated content")
puts "Relation archived?:    #{ar.archived?}"
puts "Relation archived_at:  #{ar.article_archive.created_at}"
puts "Relation archiver_id:  #{ar.article_archive.archiver_id}"
puts "Relation reason:       #{ar.article_archive.reason}"

# SQL 確認
puts ArticleWithRelation.archived.to_sql

# DB 制約確認: 同じ記事を二重アーカイブしようとするとエラーになること
begin
  ar.archive!(Struct.new(:id).new(user_id))
rescue ActiveRecord::RecordNotUnique => e
  puts "二重アーカイブを DB 制約が防いだ: #{e.message}"
end
```

---

## 6. 比較検証ポイント

| 検証項目 | Enum パターン | リレーション パターン |
|---|---|---|
| メタデータの管理 | 状態が増えるたびにカラムを追加 | 状態テーブルが自然にデータを保持 |
| 整合性の担保 | 二重実行防止はアプリ側ロジックが必要 | Unique Index により DB レベルで物理的に防止 |
| 履歴の活用 | 状態を戻すと `published_at` 等が失われる | `destroy` するだけでクリーンに状態を戻せる |
| 検索クエリ | `WHERE status = 1` | `INNER JOIN article_publications` |
| 状態追加時の影響範囲（核心） | 親テーブルに `add_column` マイグレーションが必要。既存の全レコードに NULL カラムが増える | 親テーブルは無変更。新テーブルを作るだけ |
| メタデータの拡張 | `reason` 等を追加しても親テーブルが肥大化する | `article_archives` テーブル内で完結。親テーブルはクリーンなまま |

---

## 7. 実装上の制約・方針

- **Concern は使用しない** — モデルファイルに直接ロジックを記述する
- **バリデーションは最小限** — `title` の presence のみ
- **"Everything is CRUD"** — Fizzy の精神に基づき、シンプルな実装を優先する
- **User モデルは作成しない** — 検証スクリプトでは `Struct.new(:id).new(1)` で代替する

### 既知のトレードオフ（実装スコープ外・ブログ記事内で言及する）

以下はサンプルアプリでは対処しないが、ブログ記事内でフェアに触れる設計上の論点。

#### 1. 貧血ドメインモデルの問題

`ArticleWithRelation` は `article_publication` が存在しないと自分の状態を答えられず、モデルが自己完結していない。これは「良いコード/悪いコード」的な観点では貧血ドメインモデルに見える。ただし37signals的には「状態という関心事を別オブジェクトに委譲している」設計意図であり、貧血ではなく責務の分離と解釈する。

#### 2. 状態の排他制約はアプリ側で担保する

`article_publications` と `article_archives` は別テーブルのため、DB制約だけでは「公開中かつアーカイブ済み」という矛盾した状態を防げない。`archive!` メソッド内で `transaction` を使い `article_publication&.destroy` を先に実行することで対処する。

#### 3. 遷移履歴の管理はスコープ外

状態の往来（publish → unpublish → publish）は `destroy` + `create` で実現できるが、その履歴を残したい場合は別途 `article_publication_histories` のような追記専用テーブルが必要になる。本アプリでは「現在の状態だけ管理する」スコープとし、履歴管理は対象外とする。

---

## 8. Claude Code マルチエージェントへの作業指示

### Phase 1（公開機能）

1. **Agent A（DB 担当）**: Phase 1 の Migration ファイルを作成し `rails db:migrate` を実行
2. **Agent B（Model 担当）**: `ArticleWithEnum` / `ArticleWithRelation` / `ArticlePublication` の3ファイルを実装
3. **Agent C（検証担当）**: セクション5・Phase 1 スクリプトを Rails Console で実行し、出力結果を記録

### Phase 2（アーカイブ機能を後追い追加）

4. **Agent A（DB 担当）**: Enum 側の `add_column` マイグレーション と、リレーション側の `create_article_archives` マイグレーションをそれぞれ作成し `rails db:migrate` を実行
5. **Agent B（Model 担当）**: `ArticleWithEnum` に `archive!` を追記、`ArticleWithRelation` に `has_one :article_archive` 等を追記、`ArticleArchive` を新規作成
6. **Agent C（検証担当）**: セクション5・Phase 2 スクリプトを実行し、二重アーカイブ時の DB 制約エラーも含めて出力結果を記録

> **ブログ記事上の見せ方**: Phase 1 → Phase 2 の diff（特に migration ファイルの差）をそのまま掲載することで、「親テーブルへの変更がゼロ」というリレーションパターンの優位性を視覚的に示す。
