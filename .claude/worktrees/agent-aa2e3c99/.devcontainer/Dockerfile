FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

ARG USERNAME=node

# Supabase CLI
# バージョンとSHA256を固定してサプライチェーン攻撃リスクを軽減
# SHA256の確認元（公式）: https://github.com/supabase/homebrew-tap/blob/main/supabase.rb
# バージョンアップ時は上記URLで新しいSHA256を確認してから両方更新すること
ARG SUPABASE_VERSION=2.75.0
ARG SUPABASE_SHA256_ARM64="b551c2f8e03715be428d2592765200a9e371168fc36ec2646a84ecc530d3120e"
ARG SUPABASE_SHA256_AMD64="e5597462f865d5ac72af0453358e37ecb0d85962ad6914a114a53de847303bde"

RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "arm64" ]; then \
        TARBALL="supabase_linux_arm64.tar.gz"; \
        EXPECTED_SHA="${SUPABASE_SHA256_ARM64}"; \
    else \
        TARBALL="supabase_linux_amd64.tar.gz"; \
        EXPECTED_SHA="${SUPABASE_SHA256_AMD64}"; \
    fi && \
    curl -fsSL "https://github.com/supabase/cli/releases/download/v${SUPABASE_VERSION}/${TARBALL}" \
        -o /tmp/supabase.tar.gz && \
    echo "${EXPECTED_SHA}  /tmp/supabase.tar.gz" | sha256sum --check && \
    tar -xzf /tmp/supabase.tar.gz -C /usr/local/bin supabase && \
    chmod +x /usr/local/bin/supabase && \
    rm /tmp/supabase.tar.gz

# GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install -y gh && \
    apt-get clean

# Claude・gh の設定ディレクトリを作成（node ユーザー用）
RUN mkdir -p /home/${USERNAME}/.claude \
             /home/${USERNAME}/.config/gh && \
    chown -R ${USERNAME}:${USERNAME} /home/${USERNAME}/.claude \
                                     /home/${USERNAME}/.config/gh

# シェル履歴を永続化
RUN mkdir -p /commandhistory && \
    touch /commandhistory/.bash_history && \
    touch /commandhistory/.zsh_history && \
    chown -R ${USERNAME}:${USERNAME} /commandhistory && \
    echo 'export HISTFILE=/commandhistory/.zsh_history' >> /home/${USERNAME}/.zshrc