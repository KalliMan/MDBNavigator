#!/bin/sh
# sample-db's entry point in the public demo (compose.demo.yaml): the guard of demo_reader's settings in the
# background, then PostgreSQL as usual. compose.demo.yaml sets init: true, so tini is PID 1 and looks after both.
set -eu
gosu postgres /usr/local/share/mdbnavigator/guard-reader.sh &
exec docker-entrypoint.sh "$@"
