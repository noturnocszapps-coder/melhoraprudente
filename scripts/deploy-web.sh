#!/usr/bin/env bash
# ==============================================================================
# COMANDO MANUAL DE ATUALIZAÇÃO WEB — MELHORA PRUDENTE (NEXT.JS)
# ==============================================================================
set -e

APP_DIR="/var/www/melhora-prudente"

echo "=== [ATUALIZAÇÃO MANUAL WEB] Entrando no diretório ${APP_DIR} ==="
cd "$APP_DIR"

echo "=== [1/5] Executando Git Pull (Branch Principal) ==="
git pull origin main

echo "=== [2/5] Instalando Dependências ==="
npm ci || npm install --production=false

echo "=== [3/5] Executando Typecheck, Lint e Build ==="
npm run typecheck
npm run lint
npm run build

echo "=== [4/5] Recarregando apenas melhora-prudente-web no PM2 ==="
pm2 reload ecosystem.config.js --only melhora-prudente-web
pm2 save

echo "=== [5/5] Status do PM2 ==="
pm2 status melhora-prudente-web

echo "=== [ATUALIZAÇÃO MANUAL WEB] Concluída com sucesso! ==="

