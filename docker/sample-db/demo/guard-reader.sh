#!/bin/sh
# Puts demo_reader's settings back every 10 seconds (restore_demo_reader(), from 95-demo-reader.sh, which logs a
# warning when they had been changed). Any PostgreSQL role can change its own defaults, so a guest could otherwise
# switch off the read-only default or the statement timeout for everyone after them.
# Fails quietly while PostgreSQL starts or loads the sample data.
while true; do
    sleep 10
    psql -X -q -U "$POSTGRES_USER" -d postgres -c "select restore_demo_reader()" > /dev/null 2>&1 || true
done
