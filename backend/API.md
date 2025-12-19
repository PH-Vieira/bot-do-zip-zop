# API Documentation - WhatsApp Backend

Documentação completa para integração do **frontend** com o **backend** WhatsApp API.

---

## Sumário

1. [URL Base e Setup](#url-base-e-setup)
2. [Endpoints REST](#endpoints-rest)
   - [Sessão](#sessão)
   - [Mensagens](#mensagens)
   - [Contatos e Chats](#contatos-e-chats)
   - [Integração ERP](#integração-erp)
3. [WebSocket (Socket.IO)](#websocket-socketio)
   - [Eventos do Backend → Frontend](#eventos-do-backend--frontend)
   - [Eventos do Frontend → Backend](#eventos-do-frontend--backend)
4. [Exemplos de Integração](#exemplos-de-integração)
   - [React + Socket.IO](#react--socketio)
   - [Vue.js](#vuejs)
   - [Vanilla JS](#vanilla-js)
5. [Fluxo Completo de Uso](#fluxo-completo-de-uso)

---

## URL Base e Setup

### URL Base

```
http://localhost:3000
```

Para produção, substitua pelo domínio/IP do servidor.

### CORS

O backend está configurado para aceitar requisições da origem configurada em `.env` (`CORS_ORIGIN`). Certifique-se de configurar corretamente para seu frontend.

### Autenticação (Opcional)

Atualmente, a API não possui autenticação por padrão. Para produção, recomenda-se adicionar JWT ou API Keys.

---

## Endpoints REST

Todos os endpoints retornam JSON.

### Sessão

#### 1. Criar Nova Sessão

Cria uma nova instância do WhatsApp e retorna o `sessionId`.

**Endpoint:**
```
POST /api/session/start
```

**Response:**
```json
{
  "success": true,
  "sessionId": "abc123xyz"
}
```

**Como usar:**
1. Chame este endpoint para iniciar uma sessão.
2. Use o `sessionId` retornado para todas as operações subsequentes.
3. Conecte-se ao WebSocket para receber o QR code.

---

#### 2. Listar Todas as Sessões

Lista todas as sessões cadastradas no banco.

**Endpoint:**
```
GET /api/session/list
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "abc123xyz",
      "phone": "5511999999999",
      "status": "open",
      "createdAt": "2025-12-19T10:00:00.000Z",
      "updatedAt": "2025-12-19T10:05:00.000Z"
    }
  ]
}
```

---

#### 3. Status da Sessão

Retorna o status atual de uma sessão.

**Endpoint:**
```
GET /api/session/:sessionId/status
```

**Response:**
```json
{
  "sessionId": "abc123xyz",
  "status": "open",
  "phone": "5511999999999",
  "isActive": true,
  "createdAt": "2025-12-19T10:00:00.000Z",
  "updatedAt": "2025-12-19T10:05:00.000Z"
}
```

**Status possíveis:**
- `connecting`: Aguardando leitura do QR
- `open`: Conectado
- `closed`: Desconectado

---

#### 4. Desconectar Sessão

Desconecta a sessão sem remover do banco (pode reconectar depois).

**Endpoint:**
```
POST /api/session/:sessionId/disconnect
```

**Response:**
```json
{
  "success": true,
  "message": "Session disconnected"
}
```

---

#### 5. Deletar Sessão

Remove a sessão permanentemente do banco e desconecta.

**Endpoint:**
```
DELETE /api/session/:sessionId
```

**Response:**
```json
{
  "success": true,
  "message": "Session deleted"
}
```

---

### Mensagens

#### 1. Enviar Mensagem

Envia uma mensagem de texto, imagem, vídeo, áudio ou documento.

**Endpoint:**
```
POST /api/messages/send
```

**Body:**
```json
{
  "sessionId": "abc123xyz",
  "to": "5511999999999@s.whatsapp.net",
  "type": "text",
  "content": {
    "text": "Olá! Como posso ajudar?"
  }
}
```

**Tipos de Mensagem:**

##### Texto
```json
{
  "type": "text",
  "content": {
    "text": "Mensagem de texto"
  }
}
```

##### Imagem
```json
{
  "type": "image",
  "content": {
    "url": "https://example.com/image.jpg",
    "caption": "Legenda da imagem"
  }
}
```

##### Vídeo
```json
{
  "type": "video",
  "content": {
    "url": "https://example.com/video.mp4",
    "caption": "Legenda do vídeo"
  }
}
```

##### Áudio
```json
{
  "type": "audio",
  "content": {
    "url": "https://example.com/audio.mp3"
  }
}
```

##### Documento
```json
{
  "type": "document",
  "content": {
    "url": "https://example.com/doc.pdf",
    "fileName": "documento.pdf",
    "mimetype": "application/pdf"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "3EB0XYZ123",
  "timestamp": "1766176054"
}
```

---

#### 2. Listar Mensagens

Lista mensagens de uma sessão ou de um chat específico.

**Endpoint:**
```
GET /api/messages/:sessionId?chatId=&limit=50&offset=0
```

**Query Parameters:**
- `chatId` (opcional): JID do chat (ex: `5511999999999@s.whatsapp.net`)
- `limit` (opcional): Máximo de mensagens (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "sessionId": "abc123xyz",
      "messageId": "3EB0XYZ123",
      "fromJid": "5511999999999@s.whatsapp.net",
      "toJid": "5511888888888@s.whatsapp.net",
      "chatId": "5511999999999@s.whatsapp.net",
      "type": "text",
      "content": { "text": "Olá!" },
      "timestamp": "1766176054000",
      "status": "sent",
      "isFromMe": false,
      "createdAt": "2025-12-19T10:00:00.000Z"
    }
  ]
}
```

---

#### 3. Marcar Mensagens como Lidas

Marca mensagens de um chat como lidas.

**Endpoint:**
```
POST /api/messages/mark-read
```

**Body:**
```json
{
  "sessionId": "abc123xyz",
  "chatId": "5511999999999@s.whatsapp.net",
  "messageIds": ["3EB0XYZ123", "3EB0ABC456"]
}
```

**Response:**
```json
{
  "success": true
}
```

---

#### 4. Deletar Mensagem (para todos)

Deleta uma mensagem para todos no chat.

**Endpoint:**
```
DELETE /api/messages/delete
```

**Body:**
```json
{
  "sessionId": "abc123xyz",
  "chatId": "5511999999999@s.whatsapp.net",
  "messageId": "3EB0XYZ123"
}
```

**Response:**
```json
{
  "success": true
}
```

---

### Contatos e Chats

#### 1. Listar Contatos

Lista todos os contatos salvos de uma sessão.

**Endpoint:**
```
GET /api/chats/:sessionId/contacts
```

**Response:**
```json
{
  "contacts": [
    {
      "id": 1,
      "sessionId": "abc123xyz",
      "jid": "5511999999999@s.whatsapp.net",
      "name": "João Silva",
      "pushName": "João",
      "profilePicUrl": "https://...",
      "updatedAt": "2025-12-19T10:00:00.000Z"
    }
  ]
}
```

---

#### 2. Listar Chats

Lista todos os chats de uma sessão, ordenados pela última mensagem.

**Endpoint:**
```
GET /api/chats/:sessionId/chats
```

**Response:**
```json
{
  "chats": [
    {
      "id": 1,
      "sessionId": "abc123xyz",
      "chatId": "5511999999999@s.whatsapp.net",
      "name": "João Silva",
      "isGroup": false,
      "unreadCount": 3,
      "lastMessageTime": "1766176054000",
      "archived": false,
      "pinned": false,
      "muted": false,
      "updatedAt": "2025-12-19T10:05:00.000Z",
      "messages": [
        {
          "id": 10,
          "messageId": "3EB0XYZ123",
          "type": "text",
          "content": { "text": "Última mensagem" },
          "timestamp": "1766176054000",
          "isFromMe": false
        }
      ]
    }
  ]
}
```

---

#### 3. Detalhes de um Chat

Retorna informações detalhadas de um chat específico com suas mensagens.

**Endpoint:**
```
GET /api/chats/:sessionId/chat/:chatId
```

**Response:**
```json
{
  "chat": {
    "id": 1,
    "sessionId": "abc123xyz",
    "chatId": "5511999999999@s.whatsapp.net",
    "name": "João Silva",
    "isGroup": false,
    "unreadCount": 0,
    "lastMessageTime": "1766176054000",
    "messages": [
      {
        "id": 10,
        "messageId": "3EB0XYZ123",
        "fromJid": "5511999999999@s.whatsapp.net",
        "toJid": "5511888888888@s.whatsapp.net",
        "type": "text",
        "content": { "text": "Olá!" },
        "timestamp": "1766176054000",
        "status": "read",
        "isFromMe": false
      }
    ]
  }
}
```

---

### Integração ERP

#### 1. Disparar Mensagem via Evento do ERP

Envia mensagem automaticamente quando um evento ocorre no ERP (ex: pedido aprovado).

**Endpoint:**
```
POST /api/erp/trigger-message
```

**Body:**
```json
{
  "sessionId": "abc123xyz",
  "eventType": "order_approved",
  "customerId": "12345",
  "customerPhone": "5511999999999",
  "message": "Olá! Seu pedido #12345 foi aprovado e está em separação. 🎉"
}
```

**Response:**
```json
{
  "success": true
}
```

---

#### 2. Sincronizar Contatos do ERP

Valida se os contatos do ERP existem no WhatsApp.

**Endpoint:**
```
POST /api/erp/sync-contacts
```

**Body:**
```json
{
  "sessionId": "abc123xyz",
  "contacts": [
    {
      "id": "12345",
      "name": "João Silva",
      "whatsapp": "5511999999999"
    },
    {
      "id": "67890",
      "name": "Maria Santos",
      "phone": "5511888888888"
    }
  ]
}
```

**Response:**
```json
{
  "success": true
}
```

---

#### 3. Buscar Contexto do ERP para um Chat

Retorna dados do ERP relacionados ao cliente de um chat (ex: pedidos, histórico).

**Endpoint:**
```
GET /api/erp/chat-context/:chatId
```

**Response:**
```json
{
  "context": {
    "customerId": "12345",
    "customerName": "João Silva",
    "phone": "5511999999999",
    "orders": [
      {
        "id": "PED001",
        "status": "approved",
        "total": 150.00
      }
    ],
    "lastInteraction": "2025-12-19T10:00:00.000Z"
  }
}
```

---

## WebSocket (Socket.IO)

O backend usa Socket.IO para comunicação em tempo real.

### Setup Client (Socket.IO)

#### Instalação
```bash
npm install socket.io-client
```

#### Conexão
```javascript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')

socket.on('connect', () => {
  console.log('Conectado ao WebSocket:', socket.id)
})
```

---

### Eventos do Backend → Frontend

O backend **emite** estes eventos para o frontend.

#### 1. `qr:updated`

Emitido quando um novo QR code é gerado.

**Payload:**
```json
{
  "sessionId": "abc123xyz",
  "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Como usar:**
```javascript
socket.on('qr:updated', ({ sessionId, qr }) => {
  // Exibir QR code no frontend (é uma Data URL)
  document.getElementById('qr-image').src = qr
})
```

---

#### 2. `connection:status`

Emitido quando o status da conexão muda.

**Payload (Conectado):**
```json
{
  "sessionId": "abc123xyz",
  "status": "open",
  "phone": "5511999999999"
}
```

**Payload (Desconectado):**
```json
{
  "sessionId": "abc123xyz",
  "status": "closed",
  "shouldReconnect": true
}
```

**Como usar:**
```javascript
socket.on('connection:status', ({ sessionId, status, phone }) => {
  if (status === 'open') {
    console.log('WhatsApp conectado:', phone)
    // Esconder QR, mostrar interface do chat
  } else if (status === 'closed') {
    console.log('WhatsApp desconectado')
    // Mostrar aviso de desconexão
  }
})
```

---

#### 3. `message:received`

Emitido quando novas mensagens são recebidas.

**Payload:**
```json
{
  "sessionId": "abc123xyz",
  "messages": [
    {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "id": "3EB0XYZ123",
        "fromMe": false
      },
      "message": {
        "conversation": "Olá!"
      },
      "messageTimestamp": "1766176054"
    }
  ]
}
```

**Como usar:**
```javascript
socket.on('message:received', ({ sessionId, messages }) => {
  messages.forEach(msg => {
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text
    console.log('Nova mensagem:', text)
    // Adicionar mensagem à UI do chat
  })
})
```

---

#### 4. `message:updated`

Emitido quando o status de uma mensagem muda (enviada → entregue → lida).

**Payload:**
```json
{
  "sessionId": "abc123xyz",
  "updates": [
    {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "id": "3EB0XYZ123"
      },
      "update": {
        "status": 3
      }
    }
  ]
}
```

**Status:**
- `1`: Enviada
- `2`: Entregue
- `3`: Lida

**Como usar:**
```javascript
socket.on('message:updated', ({ sessionId, updates }) => {
  updates.forEach(update => {
    const messageId = update.key.id
    const status = update.update.status
    console.log(`Mensagem ${messageId} status: ${status}`)
    // Atualizar ícone de status na UI (✓, ✓✓, azul)
  })
})
```

---

### Eventos do Frontend → Backend

O frontend **emite** estes eventos para o backend.

#### 1. `session:join`

Usado para se inscrever em eventos de uma sessão específica.

**Como usar:**
```javascript
socket.emit('session:join', { sessionId: 'abc123xyz' })
```

**Quando usar:**
- Após criar uma sessão (`POST /api/session/start`)
- Ao recarregar a página e reconectar

---

#### 2. `session:leave`

Usado para desinscrever de uma sessão.

**Como usar:**
```javascript
socket.emit('session:leave', { sessionId: 'abc123xyz' })
```

---

#### 3. `typing:start`

Indica que o usuário está digitando.

**Como usar:**
```javascript
socket.emit('typing:start', {
  sessionId: 'abc123xyz',
  chatId: '5511999999999@s.whatsapp.net'
})
```

---

#### 4. `typing:stop`

Indica que o usuário parou de digitar.

**Como usar:**
```javascript
socket.emit('typing:stop', {
  sessionId: 'abc123xyz',
  chatId: '5511999999999@s.whatsapp.net'
})
```

---

## Exemplos de Integração

### React + Socket.IO

```tsx
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

function WhatsAppPanel() {
  const [qr, setQr] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    const socket = io('http://localhost:3000')

    // Criar sessão ao montar
    fetch('http://localhost:3000/api/session/start', { method: 'POST' })
      .then(r => r.json())
      .then(({ sessionId }) => {
        setSessionId(sessionId)
        socket.emit('session:join', { sessionId })
      })

    // Escutar QR
    socket.on('qr:updated', ({ qr }) => {
      setQr(qr)
    })

    // Escutar status de conexão
    socket.on('connection:status', ({ status }) => {
      if (status === 'open') {
        setConnected(true)
        setQr(null)
      } else if (status === 'closed') {
        setConnected(false)
      }
    })

    // Escutar mensagens
    socket.on('message:received', ({ messages: newMessages }) => {
      setMessages(prev => [...prev, ...newMessages])
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const sendMessage = async (to: string, text: string) => {
    await fetch('http://localhost:3000/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        to,
        type: 'text',
        content: { text }
      })
    })
  }

  return (
    <div>
      {qr && (
        <div>
          <h2>Escaneie o QR Code</h2>
          <img src={qr} alt="QR Code" />
        </div>
      )}
      {connected && (
        <div>
          <h2>WhatsApp Conectado!</h2>
          <div>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.message?.conversation || 'Mensagem'}
              </div>
            ))}
          </div>
          <button onClick={() => sendMessage('5511999999999@s.whatsapp.net', 'Olá!')}>
            Enviar Mensagem
          </button>
        </div>
      )}
    </div>
  )
}

export default WhatsAppPanel
```

---

### Vue.js

```vue
<template>
  <div>
    <div v-if="qr">
      <h2>Escaneie o QR Code</h2>
      <img :src="qr" alt="QR Code" />
    </div>
    <div v-if="connected">
      <h2>WhatsApp Conectado!</h2>
      <div v-for="(msg, i) in messages" :key="i">
        {{ msg.message?.conversation || 'Mensagem' }}
      </div>
      <button @click="sendMessage">Enviar Mensagem</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

const qr = ref(null)
const connected = ref(false)
const sessionId = ref(null)
const messages = ref([])
let socket

onMounted(async () => {
  socket = io('http://localhost:3000')

  const res = await fetch('http://localhost:3000/api/session/start', { method: 'POST' })
  const data = await res.json()
  sessionId.value = data.sessionId
  socket.emit('session:join', { sessionId: sessionId.value })

  socket.on('qr:updated', ({ qr: newQr }) => {
    qr.value = newQr
  })

  socket.on('connection:status', ({ status }) => {
    if (status === 'open') {
      connected.value = true
      qr.value = null
    }
  })

  socket.on('message:received', ({ messages: newMessages }) => {
    messages.value.push(...newMessages)
  })
})

onUnmounted(() => {
  socket?.disconnect()
})

const sendMessage = async () => {
  await fetch('http://localhost:3000/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId.value,
      to: '5511999999999@s.whatsapp.net',
      type: 'text',
      content: { text: 'Olá!' }
    })
  })
}
</script>
```

---

### Vanilla JS

```html
<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Web</title>
</head>
<body>
  <div id="qr-container" style="display:none;">
    <h2>Escaneie o QR Code</h2>
    <img id="qr-image" />
  </div>
  <div id="chat-container" style="display:none;">
    <h2>WhatsApp Conectado!</h2>
    <div id="messages"></div>
    <button onclick="sendMessage()">Enviar Mensagem</button>
  </div>

  <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
  <script>
    const socket = io('http://localhost:3000')
    let sessionId

    // Criar sessão
    fetch('http://localhost:3000/api/session/start', { method: 'POST' })
      .then(r => r.json())
      .then(({ sessionId: id }) => {
        sessionId = id
        socket.emit('session:join', { sessionId })
      })

    // QR code
    socket.on('qr:updated', ({ qr }) => {
      document.getElementById('qr-image').src = qr
      document.getElementById('qr-container').style.display = 'block'
    })

    // Conexão
    socket.on('connection:status', ({ status }) => {
      if (status === 'open') {
        document.getElementById('qr-container').style.display = 'none'
        document.getElementById('chat-container').style.display = 'block'
      }
    })

    // Mensagens
    socket.on('message:received', ({ messages }) => {
      const container = document.getElementById('messages')
      messages.forEach(msg => {
        const text = msg.message?.conversation || 'Mensagem'
        container.innerHTML += `<div>${text}</div>`
      })
    })

    // Enviar
    function sendMessage() {
      fetch('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          to: '5511999999999@s.whatsapp.net',
          type: 'text',
          content: { text: 'Olá do navegador!' }
        })
      })
    }
  </script>
</body>
</html>
```

---

## Fluxo Completo de Uso

### 1. Criar Sessão e Conectar

1. **Frontend** chama `POST /api/session/start`
2. **Backend** retorna `sessionId`
3. **Frontend** conecta ao WebSocket e emite `session:join` com o `sessionId`
4. **Backend** emite `qr:updated` com o QR code (Data URL)
5. **Frontend** exibe o QR code para o usuário escanear com WhatsApp
6. Após escanear, **Backend** emite `connection:status` com `status: 'open'`
7. **Frontend** esconde o QR e mostra a interface de chat

### 2. Listar Chats

1. **Frontend** chama `GET /api/chats/:sessionId/chats`
2. **Backend** retorna lista de chats ordenados pela última mensagem
3. **Frontend** exibe lista de chats na sidebar

### 3. Abrir Chat e Buscar Mensagens

1. **Frontend** chama `GET /api/chats/:sessionId/chat/:chatId`
2. **Backend** retorna chat com últimas 50 mensagens
3. **Frontend** renderiza mensagens no thread

### 4. Receber Mensagem em Tempo Real

1. **Backend** emite `message:received` via WebSocket
2. **Frontend** adiciona a nova mensagem ao chat ativo

### 5. Enviar Mensagem

1. **Frontend** chama `POST /api/messages/send` com texto/mídia
2. **Backend** envia via Baileys e retorna `messageId`
3. **Backend** emite `message:updated` quando status muda (entregue/lida)

### 6. Marcar como Lida

1. **Frontend** chama `POST /api/messages/mark-read` quando usuário visualiza o chat
2. **Backend** envia confirmação de leitura ao WhatsApp

### 7. Integração ERP

1. Evento no ERP (ex: pedido aprovado)
2. ERP chama `POST /api/erp/trigger-message` com dados do cliente
3. **Backend** envia mensagem automática ao cliente

---

## Observações Finais

- **JID Format**: Números de telefone sempre incluem código de país e terminam com `@s.whatsapp.net` (ex: `5511999999999@s.whatsapp.net`)
- **Grupos**: JIDs de grupos terminam com `@g.us`
- **WebSocket**: Sempre emita `session:join` após criar ou reconectar à sessão
- **Paginação**: Use `limit` e `offset` em `/api/messages/:sessionId` para carregar mensagens antigas
- **Reconexão**: O backend tenta reconectar automaticamente em caso de desconexão não intencional
- **Persistência**: Mensagens, contatos e chats são salvos no banco PostgreSQL
- **Performance**: Use Bull queues (`QueueService`) para envio assíncrono em alta escala

---

## Suporte

Para dúvidas ou problemas, consulte os logs do backend (`npm run dev`) e verifique:
1. Status da conexão WebSocket
2. Resposta de erros nos endpoints REST
3. Logs do Prisma (queries SQL)
4. Logs do Baileys (eventos internos)

---

**Fim da Documentação**
