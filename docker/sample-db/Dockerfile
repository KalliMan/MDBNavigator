# PostgreSQL with sample data for trying MDBNavigator: Pagila (a DVD rental shop: about 20 tables, views,
# functions) and one table of a million rows to show streaming and cancel.
FROM postgres:17-alpine

# Pagila, from a fixed release, each file checked against its SHA-256: the data can't change under us.
# https://github.com/devrimgunduz/pagila (PostgreSQL licence)
# Not the newest release: pagila-v4.0.0 and later need PostgreSQL 18 (uuidv7()), and 4.1.0 and later also the
# pgvector extension. v3.1.0 is the newest release that loads on PostgreSQL 17.
ARG PAGILA_REF=pagila-v3.1.0
ARG PAGILA_SCHEMA_SHA256=8ce358e4c8014087b85296694a0893887bd7a4190e3ce407f2721b86b98e5707
ARG PAGILA_DATA_SHA256=fb81bec377687c83e11d2a24916ae28656d85550bf0ada798305bf7e2af9823b

RUN set -eux; \
    cd /docker-entrypoint-initdb.d; \
    wget -q -O 10-pagila-schema.sql "https://raw.githubusercontent.com/devrimgunduz/pagila/${PAGILA_REF}/pagila-schema.sql"; \
    wget -q -O 20-pagila-data.sql "https://raw.githubusercontent.com/devrimgunduz/pagila/${PAGILA_REF}/pagila-data.sql"; \
    echo "${PAGILA_SCHEMA_SHA256}  10-pagila-schema.sql" | sha256sum -c -; \
    echo "${PAGILA_DATA_SHA256}  20-pagila-data.sql" | sha256sum -c -; \
    # Pagila's dump gives every object to a role called postgres, which does not exist here (the user is
    # sample). Dropping those lines, after the check, leaves everything owned by sample.
    sed -i '/^ALTER .* OWNER TO postgres;$/d' 10-pagila-schema.sql; \
    chmod 644 *.sql

# Ours, after Pagila.
COPY 90-measurements.sql /docker-entrypoint-initdb.d/
