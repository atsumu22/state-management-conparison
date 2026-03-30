-- ============================================
-- 招待コード テーブル
-- ============================================

CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX invite_codes_code_idx ON invite_codes(code);
CREATE INDEX invite_codes_created_by_idx ON invite_codes(created_by);

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- 自分が作成した招待コードを閲覧可能
CREATE POLICY "Users can view own invite codes" ON invite_codes
  FOR SELECT USING (auth.uid() = created_by);

-- 招待コードを作成可能
CREATE POLICY "Users can create invite codes" ON invite_codes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 未使用の招待コードを検索可能（入力時）
CREATE POLICY "Users can view unused invite codes" ON invite_codes
  FOR SELECT USING (used_by IS NULL AND expires_at > NOW());

-- 招待コードの使用（used_by, used_at の更新）
CREATE POLICY "Users can use invite codes" ON invite_codes
  FOR UPDATE USING (used_by IS NULL AND expires_at > NOW())
  WITH CHECK (auth.uid() = used_by);
