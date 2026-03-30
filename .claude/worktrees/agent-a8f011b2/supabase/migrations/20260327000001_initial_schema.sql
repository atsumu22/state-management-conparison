-- ============================================
-- Initial Schema - やさしい交換日記
-- ============================================

-- ============================================
-- トリガー関数
-- ============================================

-- 1. updated_at 自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 新規ユーザー登録時にプロフィール自動作成
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

-- 3. published_at 自動設定（翌月1日）
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- diary_dateの翌月1日 00:00:00 を設定
  NEW.published_at = (DATE_TRUNC('month', NEW.diary_date) + INTERVAL '1 month')::TIMESTAMPTZ;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- テーブル: profiles
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#f87171',
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX profiles_partner_id_idx ON profiles(partner_id);

-- RLS
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

-- profiles の updated_at トリガー
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- auth.users の AFTER INSERT トリガー
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- テーブル: diary_entries
-- ============================================
CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  diary_date DATE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 400),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 1ユーザーにつき1日1つの日記のみ
  UNIQUE(user_id, diary_date)
);

CREATE INDEX diary_entries_user_id_idx ON diary_entries(user_id);
CREATE INDEX diary_entries_diary_date_idx ON diary_entries(diary_date);
CREATE INDEX diary_entries_published_at_idx ON diary_entries(published_at);

-- RLS
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- 自分の日記は常に閲覧可能
CREATE POLICY "Users can view own diaries" ON diary_entries
  FOR SELECT USING (auth.uid() = user_id);

-- 自分の日記を作成可能
CREATE POLICY "Users can insert own diaries" ON diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 未公開（published_at が未来）の日記のみ更新可能
CREATE POLICY "Users can update own unpublished diaries" ON diary_entries
  FOR UPDATE USING (
    auth.uid() = user_id AND published_at > NOW()
  );

-- 未公開の日記のみ削除可能
CREATE POLICY "Users can delete own unpublished diaries" ON diary_entries
  FOR DELETE USING (
    auth.uid() = user_id AND published_at > NOW()
  );

-- パートナーの公開済み日記は読み取り可能
CREATE POLICY "Users can view partner published diaries" ON diary_entries
  FOR SELECT USING (
    published_at IS NOT NULL AND published_at <= NOW() AND
    user_id IN (
      SELECT partner_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT id FROM profiles WHERE partner_id = auth.uid()
    )
  );

-- diary_entries の updated_at トリガー
CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- diary_entries の published_at 自動設定トリガー
CREATE TRIGGER set_diary_published_at
  BEFORE INSERT ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_published_at();

-- ============================================
-- テーブル: stamps
-- ============================================
CREATE TABLE stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id UUID NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 1ユーザーにつき1つの日記に1つのスタンプのみ
  UNIQUE(diary_entry_id, user_id)
);

CREATE INDEX stamps_diary_entry_id_idx ON stamps(diary_entry_id);
CREATE INDEX stamps_user_id_idx ON stamps(user_id);

-- RLS
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;

-- 公開済み日記のスタンプは閲覧可能
CREATE POLICY "Users can view stamps on published diaries" ON stamps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM diary_entries
      WHERE diary_entries.id = stamps.diary_entry_id
        AND diary_entries.published_at IS NOT NULL
        AND diary_entries.published_at <= NOW()
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

-- パートナーの公開済み日記にスタンプを追加可能
CREATE POLICY "Users can add stamps to partner diaries" ON stamps
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM diary_entries
      WHERE diary_entries.id = stamps.diary_entry_id
        AND diary_entries.published_at IS NOT NULL
        AND diary_entries.published_at <= NOW()
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

-- ============================================
-- ビュー: my_and_partner_diaries
-- ============================================
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
  OR (
    de.published_at IS NOT NULL AND de.published_at <= NOW() AND
    de.user_id IN (
      SELECT partner_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT id FROM profiles WHERE partner_id = auth.uid()
    )
  );
