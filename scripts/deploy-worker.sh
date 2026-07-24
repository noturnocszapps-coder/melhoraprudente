#!/usr/bin/env bash
# ==============================================================================
# DEPLOY TIPO: WORKER (MELHORA PRUDENTE - GARIMPO WORKER)
# ==============================================================================
set -e

echo "=== [DEPLOY WORKER] Atualizando Worker do Garimpo ==="
git pull origin main
npm install --production=false
pm2 reload ecosystem.config.js --only melhora-prudente-worker
pm2 save
echo "=== [DEPLOY WORKER] Finalizado com sucesso! ==="
