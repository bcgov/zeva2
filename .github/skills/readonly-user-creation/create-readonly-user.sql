-- Create a read-only PostgreSQL login user (not a shared role) with SELECT
-- access to all existing and future tables, views, and sequences in the
-- public schema of a target database.
--
-- Target: PostgreSQL 17 (also valid for 12+).
--
-- This is a PASTE-READY template: replace the <...> placeholders with real
-- values, then copy the statements straight into an interactive psql session.
-- (No psql -v variables are used, so it works when pasted at the prompt.)
--
-- Notes:
--   * Run as a superuser or the database owner.
--   * <object_creator> is the role that creates tables (app/migration/postgres).
--     Future-object grants only apply to objects created by that role, so run
--     the ALTER DEFAULT PRIVILEGES block once per creating role if there are
--     several. The table owner is normally the creator:
--       SELECT tableowner, count(*) FROM pg_tables
--       WHERE schemaname='public' GROUP BY tableowner;
--   * Repeat the schema-scoped statements for each schema if more than one.
--   * Never commit a real password.

-- 1. Create the read-only login user
CREATE USER <username> WITH PASSWORD '<password>';

-- 2. Connect to the target database
\c <db_name>

-- 3. Database + schema access
GRANT CONNECT ON DATABASE <db_name> TO <username>;
GRANT USAGE ON SCHEMA public TO <username>;

-- 4. Read access to existing objects (tables + views + sequences)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO <username>;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO <username>;

-- 5. Read access to FUTURE objects created by the object creator role.
--    Repeat this block for each role that creates tables.
ALTER DEFAULT PRIVILEGES FOR ROLE <object_creator> IN SCHEMA public
    GRANT SELECT ON TABLES TO <username>;
ALTER DEFAULT PRIVILEGES FOR ROLE <object_creator> IN SCHEMA public
    GRANT SELECT ON SEQUENCES TO <username>;
