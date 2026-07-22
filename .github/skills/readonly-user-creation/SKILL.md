---
name: readonly-user-creation
description: Generate a psql script for PostgreSQL 17 that creates a read-only login user with SELECT access to all existing and future tables, views, and sequences in the public schema of a database. Use this when asked to produce a script that provisions a read-only database user (a single login user, not a shared role).
---

# Read-Only User Creation (PostgreSQL 17)

Use this skill to **generate a ready-to-paste SQL script targeting PostgreSQL 17**
that provisions a **single read-only login user** (not a shared `NOLOGIN` role)
with `SELECT` access to all existing and future tables, views, and sequences in
the `public` schema of a target database.

The output is **plain SQL with the real values already substituted in** — the
user copies it and pastes it directly into an interactive `psql` session. Do
**not** use psql `-v` variables (`:"username"`, `:'password'`) in the output;
those only work with `psql -v ... -f file.sql`, not when pasting into a prompt.
The skill does not connect to or modify any database itself.

## Inputs to collect

Before generating SQL, confirm these values with the requester:

- `db_name` — the target database (for example `lcfs`).
- `username` — the read-only login user to create (for example `dap_readonly_test`).
- `password` — a strong password, or a note that it will be injected from a secret manager.
- `schema` — defaults to `public`; ask if other schemas are needed.
- `object_creator` — the role(s) that create tables (for example the app or migration user).
  This is required so future-object grants (`ALTER DEFAULT PRIVILEGES`) actually apply.

## Rules and guidance

1. Create only a **user** (`CREATE USER` = `CREATE ROLE ... LOGIN`). Do **not**
   create a separate group role unless explicitly requested.
2. Grant `CONNECT` on the database and `USAGE` on each schema.
3. Grant `SELECT` on all existing tables, views, and sequences.
4. Use `ALTER DEFAULT PRIVILEGES` so future objects are covered automatically.
   - `ALTER DEFAULT PRIVILEGES` only applies to objects created by the role that
     runs it. If tables are created by a different role (migration/app user),
     run `ALTER DEFAULT PRIVILEGES FOR ROLE <object_creator>` for each such role.
5. In PostgreSQL, `GRANT SELECT ON ALL TABLES` already includes views — no
   separate view step is needed.
6. Repeat the schema-scoped statements for every schema if more than one.
7. Output **literal, paste-ready SQL** — substitute the collected inputs
   directly into the statements. Do not emit psql `-v` variables, since the
   user pastes the SQL straight into a `psql` prompt.
8. For the password, fill in the value the user provides; if none is given, use
   a clearly-marked placeholder like `'CHANGE_ME_STRONG_PASSWORD'` and remind
   them to replace it. Never commit real passwords to files.

## Script template

Generate paste-ready SQL by replacing the `<...>` placeholders with the collected
inputs. Emit the result directly in your reply so the user can copy it into a
`psql` session. Valid for PostgreSQL 17 (and 12+). A reference copy lives in
`create-readonly-user.sql` in this skill's directory.

```sql
-- Run as a superuser or the database owner.
-- Replace <username>, <password>, <db_name>, <object_creator> before running.

-- 1. Create the read-only login user
CREATE USER <username> WITH PASSWORD '<password>';

-- 2. Connect to the target database
\c <db_name>

-- 3. Database + schema access
GRANT CONNECT ON DATABASE <db_name> TO <username>;
GRANT USAGE ON SCHEMA public TO <username>;

-- 4. Read access to existing objects
GRANT SELECT ON ALL TABLES IN SCHEMA public TO <username>;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO <username>;

-- 5. Read access to FUTURE objects created by the object creator role(s).
--    Repeat for each role that creates tables (app/migration/postgres, etc).
ALTER DEFAULT PRIVILEGES FOR ROLE <object_creator> IN SCHEMA public
    GRANT SELECT ON TABLES TO <username>;
ALTER DEFAULT PRIVILEGES FOR ROLE <object_creator> IN SCHEMA public
    GRANT SELECT ON SEQUENCES TO <username>;
```

## Example output

For `username=dap_readonly_test`, `db_name=lcfs`, `object_creator=postgres`, the
skill emits this paste-ready SQL (the user copies it straight into `psql`):

```sql
-- 1. Create the read-only login user
CREATE USER dap_readonly_test WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';

-- 2. Connect to the target database
\c lcfs

-- 3. Database + schema access
GRANT CONNECT ON DATABASE lcfs TO dap_readonly_test;
GRANT USAGE ON SCHEMA public TO dap_readonly_test;

-- 4. Read access to existing objects
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dap_readonly_test;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO dap_readonly_test;

-- 5. Read access to future objects created by the object creator role
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT SELECT ON TABLES TO dap_readonly_test;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT SELECT ON SEQUENCES TO dap_readonly_test;
```

## Verification

After running, confirm the grants:

```sql
-- Existing table privileges for the user
SELECT table_schema, count(*)
FROM information_schema.role_table_grants
WHERE grantee = 'USERNAME_HERE' AND privilege_type = 'SELECT'
GROUP BY table_schema;

-- Future-object default privileges
SELECT n.nspname AS schema, r.rolname AS creator, d.defaclacl
FROM pg_default_acl d
JOIN pg_namespace n ON n.oid = d.defaclnamespace
JOIN pg_roles r ON r.oid = d.defaclrole;
```

## Common pitfalls

- Forgetting `ALTER DEFAULT PRIVILEGES FOR ROLE <object_creator>` — future tables
  created by the migration/app user will then be inaccessible to the read-only user.
- Multiple schemas — the schema-scoped statements must be repeated per schema.
- Granting on the wrong database — always `\c` into the target database first.
- Committing real passwords — keep them out of version control.
