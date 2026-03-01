#!/bin/bash

# Настройки
BUCKET_NAME="nexus-state"
DIST_DIR="docs/.vitepress/dist"

# Проверка папки
if [ ! -d "$DIST_DIR" ]; then
  echo "❌ Папка $DIST_DIR не найдена. Выполните: npm run build"
  exit 1
fi

# Проверка yc
if ! command -v yc &> /dev/null; then
  echo "❌ yc CLI не установлен. Установите: https://cloud.yandex.ru/docs/cli/quickstart"
  exit 1
fi

# Проверка авторизации
if ! yc config list &> /dev/null; then
  echo "❌ yc не настроен. Выполните: yc init"
  exit 1
fi

echo "✅ Начинаем загрузку в бакет: $BUCKET_NAME"

# Функция загрузки (без --no-progress, с yc storage s3 cp)
upload_with_mime() {
  local file=$1
  local key=$2
  local mime=$3

  echo "📤 Загружаю $key → $mime"
  yc storage s3 cp "$file" "s3://$BUCKET_NAME/$key" \
    --content-type "$mime" \
    --acl public-read
  if [ $? -ne 0 ]; then
    echo "❌ Ошибка при загрузке $file"
    exit 1
  fi
}

# JS
find "$DIST_DIR" -name "*.js" -type f | while read file; do
  key="${file#$DIST_DIR/}"
  upload_with_mime "$file" "$key" "application/javascript"
done

# CSS
find "$DIST_DIR" -name "*.css" -type f | while read file; do
  key="${file#$DIST_DIR/}"
  upload_with_mime "$file" "$key" "text/css"
done

# HTML
find "$DIST_DIR" -name "*.html" -type f | while read file; do
  key="${file#$DIST_DIR/}"
  upload_with_mime "$file" "$key" "text/html"
done

# Остальные файлы
find "$DIST_DIR" -type f | grep -v -E "\.(js|css|html)$" | while read file; do
  key="${file#$DIST_DIR/}"

  case "${key##*.}" in
    png)  mime="image/png" ;;
    jpg|jpeg) mime="image/jpeg" ;;
    gif)  mime="image/gif" ;;
    svg)  mime="image/svg+xml" ;;
    json) mime="application/json" ;;
    xml)  mime="application/xml" ;;
    txt)  mime="text/plain" ;;
    woff) mime="font/woff" ;;
    woff2) mime="font/woff2" ;;
    ttf)  mime="font/ttf" ;;
    eot)  mime="application/vnd.ms-fontobject" ;;
    *)    mime="binary/octet-stream" ;;
  esac

  upload_with_mime "$file" "$key" "$mime"
done

echo "✅ Загрузка завершена!"
echo "🌐 Сайт доступен: https://storage.yandexcloud.net/$BUCKET_NAME/index.html"