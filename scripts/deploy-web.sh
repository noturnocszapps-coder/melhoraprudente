#!/usr/bin/env bash
# ==============================================================================
# DEPLOY TIPO: WEB (MELHORA PRUDENTE - NEXT.JS)
# ==============================================================================
set -e

echo "=== [DEPLOY WEB] Atualizando Melhora Prudente (Next.js) ==="
git pull origin main
npm install --production=false
npm run build
pm2 reload ecosystem.config.js --only melhora-prudente-web
pm2 save
echo "=== [DEPLOY WEB] Finalizado com sucesso! ==="
