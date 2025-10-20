#!/bin/bash
set -e

echo "🔄 Restoring dvdrental database..."

# Wait for PostgreSQL to be ready
until pg_isready -U postgres; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Create the dvdrental database if it doesn't exist
echo "📦 Creating dvdrental database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE dvdrental'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dvdrental')\gexec
EOSQL

# Check if the database file exists
if [ -f /tmp/dvdrental.tar ]; then
    echo "📥 Restoring dvdrental database from /tmp/dvdrental.tar..."
    pg_restore -U "$POSTGRES_USER" -d dvdrental -v /tmp/dvdrental.tar
    echo "✅ Database dvdrental restored successfully!"
else
    echo "⚠️  Warning: /tmp/dvdrental.tar not found. Skipping database restore."
    echo "ℹ️  To restore the database:"
    echo "   1. Extract dvdrental.tar from dvdrental.zip"
    echo "   2. Place dvdrental.tar in the db-init/ directory"
    echo "   3. Restart the containers: docker-compose down -v && docker-compose up -d"
fi
