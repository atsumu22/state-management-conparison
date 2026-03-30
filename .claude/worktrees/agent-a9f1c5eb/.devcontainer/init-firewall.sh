#!/bin/bash
# ファイアウォール設定
# 許可するドメインのみ通信可能にする（それ以外はブロック）
# Anthropic 公式の devcontainer 設定を参考にしたホワイトリスト方式

set -e

# 許可するドメイン（名前解決してIPを取得）
ALLOWED_DOMAINS=(
  "api.anthropic.com"       # Claude API
  "statsig.anthropic.com"   # Anthropic 内部
  "sentry.io"               # エラーロギング
  "github.com"              # GitHub
  "api.github.com"          # GitHub API
  "registry.npmjs.org"      # npm
  "registry.yarnpkg.com"    # yarn
  "supabase.com"            # Supabase
  "supabase.io"             # Supabase
  "vercel.com"              # Vercel デプロイ
)

echo "ファイアウォール設定を開始します..."

# デフォルトはすべてブロック（OUTPUTチェーン）
iptables -P OUTPUT DROP

# ループバック・ローカルは常に許可
iptables -A OUTPUT -o lo -j ACCEPT

# 確立済みセッションは許可
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# DNS（ポート53）は許可
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT

# SSH（ポート22）は許可
iptables -A OUTPUT -p tcp --dport 22 -j ACCEPT

# Supabase ローカル開発環境（コンテナ内）は許可
iptables -A OUTPUT -d 127.0.0.1 -j ACCEPT

# 許可ドメインのIPを解決してホワイトリストに追加
for domain in "${ALLOWED_DOMAINS[@]}"; do
  echo "  許可: $domain"
  ips=$(dig +short "$domain" A 2>/dev/null || true)
  for ip in $ips; do
    iptables -A OUTPUT -d "$ip" -j ACCEPT 2>/dev/null || true
  done
done

echo "ファイアウォール設定が完了しました"
echo "許可ドメイン: ${ALLOWED_DOMAINS[*]}"