import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { config } from './config/env.js'
import { logger } from './config/logger.js'
import { setupWebSocket } from './websocket/SocketServer.js'
import { sessionRoutes } from './routes/session.routes.js'
import { messageRoutes } from './routes/message.routes.js'
import { chatRoutes } from './routes/chat.routes.js'
import { erpRoutes } from './routes/erp.routes.js'

async function main() {
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'debug' : 'info',
      transport: config.nodeEnv === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined
    }
  })

  // Register plugins
  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true
  })

  await fastify.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB
    }
  })

  // Health check
  fastify.get('/health', async (req, reply) => {
    reply.send({ status: 'ok', timestamp: Date.now() })
  })
  // Register routes
  fastify.register(sessionRoutes, { prefix: '/api/session' })
  fastify.register(messageRoutes, { prefix: '/api/messages' })
  fastify.register(chatRoutes, { prefix: '/api/chats' })
  fastify.register(erpRoutes, { prefix: '/api/erp' })

  // Start server
  await fastify.listen({ port: config.port, host: '0.0.0.0' })

  // Setup WebSocket
  setupWebSocket(fastify.server)

  logger.info(`Server running on http://localhost:${config.port}`)
  logger.info(`WebSocket server ready`)
}

main().catch((err) => {
  logger.error(err, 'Failed to start server')
  process.exit(1)
})
