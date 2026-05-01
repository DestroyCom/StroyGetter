#!/bin/sh
set -e

# Create data directories and fix ownership before dropping to nextjs user
mkdir -p /temp/stroygetter/database /temp/stroygetter/source /temp/stroygetter/cached
chown -R nextjs:nodejs /temp/stroygetter

cd /migrate
chown -R nextjs:nodejs /migrate

if ! su-exec nextjs node_modules/.bin/prisma migrate deploy; then
  echo "Deploy failed — resolving failed migrations..."

  FAILED=$(su-exec nextjs node_modules/.bin/prisma migrate status 2>&1 \
    | grep -oE '[0-9]{14}_[a-zA-Z0-9_]+' || true)

  if [ -z "$FAILED" ]; then
    echo "No failed migrations found, aborting."
    exit 1
  fi

  for migration in $FAILED; do
    echo "  -> Resolve --applied: $migration"
    su-exec nextjs node_modules/.bin/prisma migrate resolve --applied "$migration" 2>/dev/null || true
  done

  su-exec nextjs node_modules/.bin/prisma migrate deploy
fi

cd /app
exec su-exec nextjs node server.js
