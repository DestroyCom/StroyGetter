#!/bin/sh
set -e

cd /migrate

if ! node_modules/.bin/prisma migrate deploy; then
  echo "Deploy failed — resolving failed migrations..."

  FAILED=$(node_modules/.bin/prisma migrate status 2>&1 \
    | grep -oE '[0-9]{14}_[a-zA-Z0-9_]+' || true)

  if [ -z "$FAILED" ]; then
    echo "No failed migrations found, aborting."
    exit 1
  fi

  for migration in $FAILED; do
    echo "  -> Resolve --applied: $migration"
    node_modules/.bin/prisma migrate resolve --applied "$migration" 2>/dev/null || true
  done

  node_modules/.bin/prisma migrate deploy
fi

cd /app
exec node server.js
