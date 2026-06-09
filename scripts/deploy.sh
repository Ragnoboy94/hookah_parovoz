#!/bin/bash
# Деплой на сервере. Запуск: bash scripts/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Защита живых данных от git pull"
for f in data/content.json data/tables.json data/bookings.json; do
  if [ -f "$f" ]; then
    git update-index --skip-worktree "$f" 2>/dev/null || true
  fi
done

echo "==> git pull"
git fetch origin main
git reset --hard origin/main

echo "==> install & build"
npm install
npm run build

echo "==> restart"
pm2 restart parovoz --update-env

echo "==> ping search engines"
node scripts/ping-search.mjs || true

echo "==> done"
pm2 status | head -5
