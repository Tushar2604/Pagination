#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Link a PostgreSQL database to this service in Render:"
  echo "  Dashboard → codevector-api → Environment → Add from Database"
  exit 1
fi

echo "Running migrations..."
npx prisma migrate deploy

echo "Running seed (skips if data already exists)..."
npx tsx prisma/seed.ts

echo "Starting API server..."
exec node dist/server.js
