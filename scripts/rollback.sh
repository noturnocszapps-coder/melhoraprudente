#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE ROLLBACK DE EMERGÊNCIA
# ==============================================================================
set -e

if [ -z "$1" ]; then
  echo "Uso: ./scripts/rollback.sh <COMMIT_HASH>"
  echo "Exemplo: ./scripts/rollback.sh a1b2c3d"
  exit 1
fi

COMMIT_HASH=$1

echo "=== [ROLLBACK] Revertendo para o commit ${COMMIT_HASH} ==="
git reset --hard ${COMMIT_HASH}
npm install --production=false
npm run build
pm2 reload ecosystem.config.js --env production
pm2 save
echo "=== [ROLLBACK] Reversão concluída com sucesso! ==="
