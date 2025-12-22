# Guia de Aplicação Manual da Migration

## Opção 1: Usando Prisma db push (mais simples)

Esta opção não requer shadow database:

```bash
cd ~/repos/bot-do-zip-zop/backend
npx prisma db push
npx prisma generate
```

⚠️ **Atenção**: `db push` sincroniza o schema sem criar histórico de migrations.

---

## Opção 2: Aplicar SQL manualmente (recomendado para produção)

### Passo 1: Aplicar o SQL diretamente

```bash
cd ~/repos/bot-do-zip-zop/backend

# Aplicar o SQL no banco
psql "$DATABASE_URL" -f prisma/migrations/20251222164030_add_conversations/migration.sql
```

### Passo 2: Registrar a migration no Prisma

```bash
psql "$DATABASE_URL" << 'EOF'
-- Criar tabela de migrations se não existir
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

-- Registrar a migration como aplicada
INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, applied_steps_count)
VALUES (
    gen_random_uuid()::text,
    'manual',
    '20251222164030_add_conversations',
    now(),
    1
)
ON CONFLICT DO NOTHING;
EOF
```

### Passo 3: Gerar Prisma Client

```bash
npx prisma generate
```

---

## Opção 3: Desabilitar shadow database permanentemente (alternativa)

Adicione ao `.env`:

```env
DATABASE_URL="postgresql://user:password@127.0.0.1:5432/whatsapp_api?schema=public"
SHADOW_DATABASE_URL="postgresql://user:password@127.0.0.1:5432/whatsapp_api?schema=shadow"
```

Depois rode:

```bash
npx prisma migrate dev --name add_conversations
```

---

## Verificação

Após aplicar, verifique se a tabela foi criada:

```bash
psql "$DATABASE_URL" -c "\dt conversations"
psql "$DATABASE_URL" -c "SELECT * FROM _prisma_migrations WHERE migration_name LIKE '%conversations%';"
```

---

## Troubleshooting

Se der erro de permissão novamente, peça ao DBA para conceder:

```sql
GRANT CREATE ON DATABASE whatsapp_api TO seu_usuario;
```

Ou use a **Opção 1** (`db push`) que é mais simples e não precisa de permissões especiais.
