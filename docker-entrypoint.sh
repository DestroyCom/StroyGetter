#!/bin/sh
set -e
node node_modules/.bin/prisma migrate deploy
exec node server.js
