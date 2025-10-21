#!/bin/bash
set -e

echo "🔄 Database initialization script starting..."

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER"; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Check if dvdrental database exists and has data
DB_EXISTS=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='dvdrental'" || echo "0")
TABLE_COUNT=0

if [ "$DB_EXISTS" = "1" ]; then
  TABLE_COUNT=$(psql -U "$POSTGRES_USER" -d dvdrental -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" || echo "0")
  echo "📊 Database 'dvdrental' exists with $TABLE_COUNT tables"
fi

# Only restore if database doesn't exist or is empty
if [ "$DB_EXISTS" != "1" ] || [ "$TABLE_COUNT" = "0" ]; then
  echo "📦 Creating dvdrental database..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE dvdrental'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dvdrental')\gexec
EOSQL

  if [ -f /tmp/dvdrental.tar ]; then
    echo "📥 Restoring dvdrental database from /tmp/dvdrental.tar..."
    pg_restore -U "$POSTGRES_USER" -d dvdrental -v /tmp/dvdrental.tar 2>&1 || true
    echo "✅ Database dvdrental restored successfully!"
  else
    echo "⚠️  Warning: /tmp/dvdrental.tar not found. Skipping database restore."
    echo "ℹ️  To restore the database:"
    echo "   1. Extract dvdrental.tar from dvdrental.zip"
    echo "   2. Place dvdrental.tar in the db-init/ directory"
    echo "   3. Restart the containers: docker-compose down -v && docker-compose up -d"
  fi
else
  echo "✅ Database 'dvdrental' already initialized with data. Skipping restore."
fi
