#!/bin/bash

# Script para aplicar migration manualmente no servidor
# Execute este script no servidor: bash apply-migration.sh

echo "Aplicando migration add_conversations..."

# Aplicar o SQL diretamente no banco
psql "$DATABASE_URL" -f prisma/migrations/20251222164030_add_conversations/migration.sql

# Marcar a migration como aplicada no Prisma
psql "$DATABASE_URL" << EOF
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
VALUES (
    '$(uuidgen)',
    '$(md5sum prisma/migrations/20251222164030_add_conversations/migration.sql | cut -d" " -f1)',
    '20251222164030_add_conversations',
    now(),
    1
)
ON CONFLICT DO NOTHING;
EOF

echo "✅ Migration aplicada com sucesso!"
echo "Agora execute: npx prisma generate"
