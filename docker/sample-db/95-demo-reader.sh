#!/bin/sh
# demo_reader: the read-only role guests of the public demo use (docs/security.md, "Public demo"). It may read
# Pagila and demo.measurements and nothing else. Created in every setup, so a local Compose shows the same thing;
# compose.demo.yaml adds the rest (who may log in, the settings guard, temp_file_limit).
# Runs once, when the data volume is empty, after Pagila (10, 20) and the big table (90).
set -eu

: "${DEMO_READER_PASSWORD:?DEMO_READER_PASSWORD is not set}"

psql -v ON_ERROR_STOP=1 -X -q --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
    -v reader_password="$DEMO_READER_PASSWORD" <<'SQL'
-- Enough for the app's few connections at a time; past it a guest gets "too many connections for role".
create role demo_reader login password :'reader_password' connection limit 20;

-- Only this database. CONNECT and TEMPORARY are everyone's by default.
revoke connect, temporary on database pagila from public;
grant connect on database pagila to demo_reader;
revoke connect on database postgres from public;
revoke connect on database template1 from public;

-- Pagila's dump gives everyone CREATE on public ("GRANT ALL ON SCHEMA public TO PUBLIC"). Taken back.
revoke create on schema public from public;

-- Reading only.
grant usage on schema public, demo to demo_reader;
grant select on all tables in schema public, demo to demo_reader;

-- rewards_report() runs as its owner, the superuser (SECURITY DEFINER).
revoke execute on function public.rewards_report(integer, numeric) from public;
-- Guests share this role, so these would let one cancel or end another's queries.
revoke execute on function pg_catalog.pg_cancel_backend(integer) from public;
revoke execute on function pg_catalog.pg_terminate_backend(integer, bigint) from public;
-- Large objects need no table privilege: inside BEGIN READ WRITE anyone could write them to disk.
revoke execute on function pg_catalog.lo_create(oid), pg_catalog.lo_creat(integer), pg_catalog.lo_from_bytea(oid, bytea) from public;

-- The role's settings, and what puts them back. In the postgres database, which guests can't reach.
\connect postgres

-- Any role can change its own defaults (ALTER ROLE ... SET, inside BEGIN READ WRITE). The demo's guard
-- (guard-reader.sh) calls this every 10 seconds: it does nothing while the settings are as expected, and otherwise
-- logs a warning and puts them back.
create function public.restore_demo_reader(quiet boolean default false) returns void
language plpgsql as $fn$
declare
    -- As PostgreSQL stores them (pg_db_role_setting), in "C" order.
    expected constant text[] := array[
        'default_transaction_read_only=on',
        'idle_in_transaction_session_timeout=60s',
        'log_statement=all',
        'statement_timeout=30s'];
    reader constant oid := (select oid from pg_roles where rolname = 'demo_reader');
    actual text[];
    database_name name;
begin
    select array_agg(setting order by setting collate "C") into actual
    from pg_db_role_setting, unnest(setconfig) as setting
    where setrole = reader and setdatabase = 0;

    if actual is not distinct from expected
       and not exists (select from pg_db_role_setting where setrole = reader and setdatabase <> 0) then
        return;
    end if;

    if not quiet then
        raise warning 'demo_reader''s settings had been changed (%), putting them back', actual;
    end if;

    -- Settings for one database (ALTER ROLE ... IN DATABASE) win over the role's own, so they go too.
    for database_name in
        select d.datname from pg_db_role_setting s join pg_database d on d.oid = s.setdatabase where s.setrole = reader
    loop
        execute format('alter role demo_reader in database %I reset all', database_name);
    end loop;

    alter role demo_reader reset all;
    alter role demo_reader set default_transaction_read_only = on;
    alter role demo_reader set idle_in_transaction_session_timeout = '60s';
    alter role demo_reader set log_statement = 'all';
    alter role demo_reader set statement_timeout = '30s';
end
$fn$;

revoke execute on function public.restore_demo_reader(boolean) from public;

select public.restore_demo_reader(quiet => true);
SQL
