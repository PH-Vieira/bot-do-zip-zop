# Bot do Zip Zop (Baileys v7)

Um bot simples em TypeScript que conecta ao WhatsApp via Baileys v7 e responde "pong" quando recebe "ping" em chats privados.

## Pré-requisitos
- Node.js 20 ou superior
- Windows PowerShell

## Instalação
1. Instale dependências:
   - Runtime: `@whiskeysockets/baileys`, `pino`
   - Dev: `typescript`, `tsx`, `@types/node`
2. Os arquivos já estão criados:
   - `package.json` (ESM)
   - `tsconfig.json` (NodeNext)
   - `src/index.ts` (bot)

## Executar
- No PowerShell, dentro da pasta do projeto:

```powershell
npm run dev
```

O QR será mostrado no terminal (via `connection.update`). Escaneie com o WhatsApp no telefone.

## TLS (certificado) – erro comum em redes corporativas
Se você ver o erro `WebSocket Error (unable to get local issuer certificate)`, sua rede está interceptando TLS e o Node não reconhece o certificado raiz da empresa.

Opções para resolver:
1. Recomendado: apontar o Node para o certificado raiz corporativo
   - Exporte o certificado raiz corporativo para um arquivo `.pem` (via MMC/Certificados)
   - Configure a variável de ambiente antes de rodar:

```powershell
$env:NODE_EXTRA_CA_CERTS = "C:\\caminho\\corp-root.pem"; npm run dev
```

2. Alternativa temporária (não recomendado em produção): desabilitar validação TLS

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"; npm run dev
```

Use apenas para testes rápidos.

## Comportamento
- Responde apenas em chats privados (`@s.whatsapp.net`)
- Case-insensitive: reconhece `ping` com qualquer capitalização
- Marca offline ao conectar para permitir notificações no app
- Logger em `debug`

## Estrutura
- `src/index.ts`: código do bot
- `auth_info_baileys/`: pasta de sessão (gerada automaticamente)

## Referências
- Baileys: https://github.com/WhiskeySockets/Baileys
- Migração v7: https://baileys.wiki/docs/migration/to-v7.0.0
