# WhatsApp API Backend

Backend completo para integração WhatsApp Web com ERP, construído com Fastify, Socket.IO, Baileys v7, Prisma (Postgres), e Bull (filas).

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- Redis 6+

## Instalação

1. Clone o repositório e entre na pasta `backend`:
```bash
cd backend
```

2. Instale dependências:
```bash
npm install
```

3. Configure variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas credenciais de banco e Redis
```

4. Configure banco de dados:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Inicie o servidor:
```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3000`.

## Estrutura

```
backend/
├── src/
│   ├── baileys/             # Gerenciamento Baileys
│   │   ├── BaileysManager.ts
│   │   ├── SessionStore.ts
│   │   └── MessageHandler.ts
│   ├── config/              # Configurações
│   ├── controllers/         # Controllers REST
│   ├── routes/              # Rotas REST
│   ├── services/            # Serviços (ERP, Queue)
│   ├── utils/               # Utilitários
│   └── websocket/           # WebSocket server
├── prisma/
│   └── schema.prisma        # Schema do banco
└── package.json
```

## Endpoints REST

Ver documentação completa em [API.md](./API.md).

## WebSocket

O servidor Socket.IO emite eventos em tempo real para QR codes, status de conexão, mensagens recebidas, etc. Ver detalhes em [API.md](./API.md).

## Deploy

Para produção, recomenda-se:
- PM2 para gerenciar processos Node
- Nginx como reverse proxy
- PostgreSQL gerenciado (AWS RDS, etc.)
- Redis gerenciado (AWS ElastiCache, etc.)

Exemplo com PM2:
```bash
npm run build
pm2 start dist/index.js --name whatsapp-api
```

## Licença

MIT
