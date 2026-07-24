#!/usr/bin/env bash
# ==============================================================================
# DEPLOY COMPLETO (WEB + WORKER)
# ==============================================================================
set -e

echo "=== [DEPLOY FULL] Atualizando Melhora Prudente Completo ==="
git pull origin main
npm install --production=false
npm run build
pm2 reload ecosystem.config.js --env production
pm2 save
echo "=== [DEPLOY FULL] Finalizado com sucesso! ==="
