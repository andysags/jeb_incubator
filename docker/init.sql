-- PostgreSQL Database Initialization Script
-- Based on installation.md configuration

-- Set encoding and create database (already done by docker environment)
-- The database 'jeb' is created automatically by PostgreSQL Docker image

-- Connect to the jeb database
\c jeb;

-- Grant connection rights to merchex_user (user is created automatically by Docker)
GRANT CONNECT ON DATABASE jeb TO merchex_user;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO merchex_user;

-- Grant permissions on existing tables and sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO merchex_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO merchex_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO merchex_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO merchex_user;

-- Grant all privileges on public schema
GRANT ALL ON SCHEMA public TO merchex_user;

-- Make merchex_user a superuser for full access (as specified in installation.md)
ALTER USER merchex_user WITH SUPERUSER;

-- Create recommended indexes (from installation.md section 14)
-- Note: This will only work after Django creates the tables
-- We'll add this to a separate script that runs after migrations
