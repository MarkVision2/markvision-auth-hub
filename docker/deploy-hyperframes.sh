#!/bin/bash
# Деплой HyperFrames на n8n.zapoinov.com
# Запуск: bash docker/deploy-hyperframes.sh

set -e

SERVER="root@n8n.zapoinov.com"
REMOTE_DIR="/root/n8n"

echo "📦 Загружаем docker-compose конфиг на сервер..."
scp docker/hyperframes.yml "$SERVER:$REMOTE_DIR/hyperframes.yml"

echo "🚀 Запускаем HyperFrames контейнер..."
ssh "$SERVER" bash -s << 'REMOTE'
  cd /root/n8n

  # Добавить env переменную если нет
  grep -q "HYPERFRAMES_SERVER_URL" .env 2>/dev/null || \
    echo "HYPERFRAMES_SERVER_URL=http://hyperframes:9847" >> .env

  # Запустить сервис
  docker compose -f docker-compose.yml -f hyperframes.yml up -d hyperframes

  echo "⏳ Ждём старта (2-3 минуты — установка ffmpeg + chromium)..."
  for i in $(seq 1 24); do
    sleep 10
    STATUS=$(docker inspect --format='{{.State.Status}}' hyperframes 2>/dev/null || echo "absent")
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' hyperframes 2>/dev/null || echo "none")
    echo "  [$i] container=$STATUS health=$HEALTH"
    if [ "$HEALTH" = "healthy" ]; then
      echo "✅ HyperFrames запущен!"
      curl -s http://localhost:9847/health | head -c 200
      break
    fi
  done
REMOTE

echo ""
echo "✅ Готово. HyperFrames доступен на http://n8n.zapoinov.com:9847"
echo ""
echo "Добавь переменную в Vercel:"
echo "  HYPERFRAMES_SERVER_URL=http://n8n.zapoinov.com:9847"
