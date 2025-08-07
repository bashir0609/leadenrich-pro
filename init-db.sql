-- Initialize PostgreSQL database for LeadEnrich Pro
-- This script creates the necessary user and database

-- Create the user if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'leadenrich_user') THEN
        CREATE USER leadenrich_user WITH PASSWORD 'secure_password_123';
    END IF;
END
$$;

-- Grant necessary privileges
ALTER USER leadenrich_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE leadenrich TO leadenrich_user;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
