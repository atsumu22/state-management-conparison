FROM ruby:3.3
 
# 必要なパッケージのインストール
RUN apt-get update -qq && apt-get install -y \
  build-essential \
  git \
  curl \
  sqlite3 \
  libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*
 
# Node.js（Railsの起動に必要）
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*
 
# 作業ディレクトリ
WORKDIR /workspace
 
# Bundler
RUN gem install bundler
 
# Claude Code
RUN npm install -g @anthropic-ai/claude-code
 