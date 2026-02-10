#!/bin/bash
set -e

# Initialize PostgreSQL primary for replication

echo "Setting up replication user..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create replication user
    CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator_password';
    
    -- Grant connection privileges
    GRANT CONNECT ON DATABASE postgres TO replicator;
    
    -- Create replication slot for each replica
    SELECT pg_create_physical_replication_slot('replica_1_slot');
    SELECT pg_create_physical_replication_slot('replica_2_slot');
    
    -- Verify replication setup
    SELECT * FROM pg_replication_slots;
EOSQL

echo "Configuring pg_hba.conf for replication..."

cat >> "$PGDATA/pg_hba.conf" <<EOF

# Replication connections
host    replication     replicator      0.0.0.0/0               md5
host    replication     replicator      ::/0                    md5
EOF

echo "Replication setup complete!"
