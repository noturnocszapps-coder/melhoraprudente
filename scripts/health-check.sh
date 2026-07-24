#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE HEALTH CHECK LOCAL DA APLICAÇÃO E WORKER
# ==============================================================================
set -e

PORT=${PORT:-3000}
HOST=${HOST:-"http://127.0.0.1"}

echo "=== [HEALTH CHECK] Verificando serviços da Melhora Prudente ==="

echo -n "1. Verificando Web Health Endpoint (${HOST}:${PORT}/api/health)... "
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${HOST}:${PORT}/api/health || echo "000")

if [ "$WEB_STATUS" -eq 200 ]; then
  echo "OK (200)"
else
  echo "FALHA (HTTP $WEB_STATUS)"
fi

echo -n "2. Verificando Worker Health Endpoint (${HOST}:${PORT}/api/worker/health)... "
WORKER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${HOST}:${PORT}/api/worker/health || echo "000")

if [ "$WORKER_STATUS" -eq 200 ]; then
  echo "OK (200)"
else
  echo "FALHA (HTTP $WORKER_STATUS)"
fi

echo -n "3. Verificando status PM2... "
if command -v pm2 >/dev/null 2>&1; then
  pm2 status melhora-prudente-web melhora-prudente-worker
else
  echo "PM2 não está rodando neste terminal local."
fi

echo "=== [HEALTH CHECK] Verificação concluída ==="
