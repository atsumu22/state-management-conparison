# Database Schema - やさしい交換日記

## テーブル構成

### 1. profiles（ユーザープロフィール）
Supabase Authと連携。ユーザーの追加情報を管理。

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#f87171', -- Tailwind rose-400
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX profiles_partner_id_idx ON profiles(partner_id);

-- RLS（Row Level Security）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールは読み書き可能
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- パートナーのプロフィールは読み取りのみ可能
CREATE POLICY "Users can view partner profile" ON profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT partner_id FROM profiles WHERE id = profiles.id
      UNION
      SELECT id FROM profiles WHERE partner_id = auth.uid()
    )
  );
```

---

### 2. diary_entries（日記エントリ）
1日1つの日記。

```sql
CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  diary_date DATE NOT NULL, -- 日記の日付（YYYY-MM-DD）
  content TEXT NOT NULL CHECK (char_length(content) <= 400), -- 400文字制限
  published_at TIMESTAMPTZ, -- 公開日時（翌月1日）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 1ユーザーにつき1日1つの日記のみ
  UNIQUE(user_id, diary_date)
);

-- インデックス
CREATE INDEX diary_entries_user_id_idx ON diary_entries(user_id);
CREATE INDEX diary_entries_diary_date_idx ON diary_entries(diary_date);
CREATE INDEX diary_entries_published_at_idx ON diary_entries(published_at);

-- RLS（Row Level Security）
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- 自分の日記は常に読み書き可能（ただし公開後は更新・削除不可）
CREATE POLICY "Users can view own diaries" ON diary_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diaries" ON diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unpublished diaries" ON diary_entries
  FOR UPDATE USING (
    auth.uid() = user_id AND published_at IS NULL
  );

CREATE POLICY "Users can delete own unpublished diaries" ON diary_entries
  FOR DELETE USING (
    auth.uid() = user_id AND published_at IS NULL
  );

-- パートナーの公開済み日記は読み取り可能
CREATE POLICY "Users can view partner published diaries" ON diary_entries
  FOR SELECT USING (
    published_at IS NOT NULL AND
    user_id IN (
      SELECT partner_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT id FROM profiles WHERE partner_id = auth.uid()
    )
  );
```

---

### 3. stamps（スタンプ）
日記に対するリアクション。

```sql
CREATE TABLE stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id UUID NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL, -- 絵文字（例: ❤️, 👍）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- 1ユーザーにつき1つの日記に1つのスタンプのみ
  UNIQUE(diary_entry_id, user_id)
);

-- インデックス
CREATE INDEX stamps_diary_entry_id_idx ON stamps(diary_entry_id);
CREATE INDEX stamps_user_id_idx ON stamps(user_id);

-- RLS（Row Level Security）
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;

-- 公開済み日記のスタンプは閲覧可能
CREATE POLICY "Users can view stamps on published diaries" ON stamps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM diary_entries
      WHERE diary_entries.id = stamps.diary_entry_id
        AND diary_entries.published_at IS NOT NULL
        AND (
          diary_entries.user_id = auth.uid()
          OR diary_entries.user_id IN (
            SELECT partner_id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT id FROM profiles WHERE partner_id = auth.uid()
          )
        )
    )
  );

-- パートナーの日記にスタンプを追加可能
CREATE POLICY "Users can add stamps to partner diaries" ON stamps
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM diary_entries
      WHERE diary_entries.id = stamps.diary_entry_id
        AND diary_entries.published_at IS NOT NULL
        AND diary_entries.user_id IN (
          SELECT partner_id FROM profiles WHERE id = auth.uid()
          UNION
          SELECT id FROM profiles WHERE partner_id = auth.uid()
        )
    )
  );

-- 自分のスタンプは削除可能
CREATE POLICY "Users can delete own stamps" ON stamps
  FOR DELETE USING (auth.uid() = user_id);
```

---

## トリガー関数

### 1. 自動的にupdated_atを更新

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- diary_entries
CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. 新規ユーザー登録時にプロフィール自動作成

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'ユーザー'),
    '#f87171' -- デフォルトカラー
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supabase Auth の users テーブルにトリガー設定
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

### 3. published_at自動設定（翌月1日）

```sql
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- diary_dateの翌月1日 00:00:00 を設定
  NEW.published_at = (DATE_TRUNC('month', NEW.diary_date) + INTERVAL '1 month')::TIMESTAMPTZ;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_diary_published_at
  BEFORE INSERT ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_published_at();
```

---

## ビュー（便利なクエリ）

### 1. 自分と相手の日記を結合したビュー

```sql
CREATE VIEW my_and_partner_diaries AS
SELECT
  de.id,
  de.user_id,
  p.name AS user_name,
  p.color AS user_color,
  de.diary_date,
  de.content,
  de.published_at,
  de.created_at,
  CASE
    WHEN de.user_id = auth.uid() THEN 'me'
    ELSE 'partner'
  END AS author_type
FROM diary_entries de
JOIN profiles p ON de.user_id = p.id
WHERE
  de.user_id = auth.uid()
  OR de.user_id IN (
    SELECT partner_id FROM profiles WHERE id = auth.uid()
    UNION
    SELECT id FROM profiles WHERE partner_id = auth.uid()
  );
```

---

## 初期データ投入（開発用）

```sql
-- テストユーザー1（自動生成されるが、カラーを変更）
UPDATE profiles
SET color = '#f87171' -- rose-400
WHERE id = 'USER_ID_1';

-- テストユーザー2（自動生成されるが、カラーを変更）
UPDATE profiles
SET color = '#60a5fa' -- blue-400
WHERE id = 'USER_ID_2';

-- パートナー関係を設定
UPDATE profiles
SET partner_id = 'USER_ID_2'
WHERE id = 'USER_ID_1';

UPDATE profiles
SET partner_id = 'USER_ID_1'
WHERE id = 'USER_ID_2';
```

---

## Supabase CLI での実行方法

### 1. マイグレーションファイル作成

```bash
supabase migration new initial_schema
```

### 2. 上記SQLを `supabase/migrations/XXXXXX_initial_schema.sql` に貼り付け

### 3. ローカルで実行

```bash
supabase db reset
```

### 4. 本番環境へデプロイ

```bash
supabase db push
```

---

## 補足情報

### published_atの計算ロジック

```
diary_date: 2026-01-15
→ published_at: 2026-02-01 00:00:00

diary_date: 2026-01-31
→ published_at: 2026-02-01 00:00:00

diary_date: 2026-02-15
→ published_at: 2026-03-01 00:00:00
```

### RLS（Row Level Security）の考え方

- **自分の日記**: 常に見れる、未公開なら編集・削除可能
- **相手の日記**: 公開済み（published_at が NULL でない）のみ見れる
- **スタンプ**: 公開済みの相手の日記にのみ追加可能

### カラーの選択肢（Tailwind CSS）

```javascript
const colors = [
  '#f87171', // rose-400
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#a78bfa', // violet-400
  '#fbbf24', // amber-400
  '#fb923c', // orange-400
];
```