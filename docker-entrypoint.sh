#!/bin/sh
set -e

echo "🚀 Starting Cashback-Help Bot..."

# Wait for database to be ready
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Waiting for database to be ready..."
  
  # Extract connection details from DATABASE_URL
  # Format: postgresql://user:password@host:port/database
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p' || echo "5432")
  
  until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U postgres > /dev/null 2>&1; do
    echo "Waiting for database at $DB_HOST:$DB_PORT..."
    sleep 2
  done
  
  echo "✅ Database is ready!"
  
  # Run SQL migrations if they exist
  if [ -d "src/database/migrations" ] && [ "$(ls -A src/database/migrations/*.sql 2>/dev/null)" ]; then
    echo "📦 Running SQL migrations..."
    
    # Extract database name from DATABASE_URL
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
    # Run each SQL migration file in order
    for migration in src/database/migrations/*.sql; do
      if [ -f "$migration" ]; then
        echo "Running migration: $(basename $migration)"
        psql "$DATABASE_URL" -f "$migration" || echo "⚠️  Migration $(basename $migration) failed or already applied"
      fi
    done
    
    echo "✅ SQL migrations completed!"
  fi
fi

# Execute the main command
exec "$@"
