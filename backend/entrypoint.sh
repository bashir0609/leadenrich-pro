#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run the database migrations
echo "Running database migrations..."
npx prisma migrate deploy
echo "Migrations complete."

# Execute the main command (passed as arguments to this script)
exec "$@"
