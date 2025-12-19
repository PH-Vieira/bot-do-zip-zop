import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { baileysManager } from '../baileys/BaileysManager.js'
import { config } from '../config/env.js'
import { logger } from '../config/logger.js'

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'WebSocket client connected')

    socket.on('session:join', ({ sessionId }) => {
      socket.join(sessionId)
      logger.info({ socketId: socket.id, sessionId }, 'Client joined session room')
    })

    socket.on('session:leave', ({ sessionId }) => {
      socket.leave(sessionId)
      logger.info({ socketId: socket.id, sessionId }, 'Client left session room')
    })

    socket.on('typing:start', async ({ sessionId, chatId }) => {
      const sock = baileysManager.getSession(sessionId)
      if (sock) {
        await sock.sendPresenceUpdate('composing', chatId)
      }
    })

    socket.on('typing:stop', async ({ sessionId, chatId }) => {
      const sock = baileysManager.getSession(sessionId)
      if (sock) {
        await sock.sendPresenceUpdate('paused', chatId)
      }
    })

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'WebSocket client disconnected')
    })
  })

  // Listen to Baileys events and emit to clients
  baileysManager.on('qr', ({ sessionId, qr }) => {
    io.to(sessionId).emit('qr:updated', { sessionId, qr })
    logger.info({ sessionId }, 'QR code emitted to clients')
  })

  baileysManager.on('connected', ({ sessionId, phone }) => {
    io.to(sessionId).emit('connection:status', {
      sessionId,
      status: 'open',
      phone
    })
    logger.info({ sessionId, phone }, 'Connection status emitted')
  })

  baileysManager.on('disconnected', ({ sessionId, shouldReconnect }) => {
    io.to(sessionId).emit('connection:status', {
      sessionId,
      status: 'closed',
      shouldReconnect
    })
    logger.info({ sessionId, shouldReconnect }, 'Disconnection emitted')
  })

  baileysManager.on('message.received', ({ sessionId, messages }) => {
    io.to(sessionId).emit('message:received', {
      sessionId,
      messages
    })
  })

  baileysManager.on('message.updated', ({ sessionId, updates }) => {
    io.to(sessionId).emit('message:updated', {
      sessionId,
      updates
    })
  })

  return io
}
