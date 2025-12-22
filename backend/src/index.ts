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
  logger.info('=== Starting WhatsApp API Backend ===')
  logger.info(`Environment: ${config.nodeEnv}`)
  logger.info(`Port: ${config.port}`)
  logger.info(`CORS Origin: ${config.cors.origin}`)

  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'debug' : 'info',
      transport: config.nodeEnv === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId'
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

  // Add request logging hook
  fastify.addHook('onRequest', async (request, reply) => {
    logger.info({
      method: request.method,
      url: request.url,
      headers: request.headers,
      ip: request.ip,
      hostname: request.hostname
    }, 'Incoming request')
  })

  // Add response logging hook
  fastify.addHook('onResponse', async (request, reply) => {
    logger.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode
    }, 'Request completed')
  })

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    // Type guard for Error objects with statusCode
    const isError = error instanceof Error
    const hasStatusCode = typeof (error as any).statusCode === 'number'
    const statusCode = hasStatusCode ? (error as any).statusCode : 500
    const message = isError ? error.message : 'Internal Server Error'
    const stack = isError ? error.stack : undefined
    
    logger.error({
      error: message,
      stack,
      statusCode,
      method: request.method,
      url: request.url
    }, 'Request error')
    
    reply.status(statusCode).send({
      error: message,
      statusCode
    })
  })

  // Health check
  fastify.get('/health', async (req, reply) => {
    logger.debug('Health check requested')
    reply.send({ 
      status: 'ok', 
      timestamp: Date.now(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      port: config.port
    })
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

  const protocol = config.nodeEnv === 'production' ? 'https' : 'http'
  const serverUrl = `${protocol}://0.0.0.0:${config.port}`
  logger.info('=== Server Started Successfully ===')
  logger.info(`Server listening on ${serverUrl}`)
  logger.info(`Health check: ${serverUrl}/health`)
  logger.info(`API base URL: ${serverUrl}/api`)
  logger.info(`WebSocket server ready on same port`)
  logger.info('===================================')
}

main().catch((err) => {
  logger.error({ error: err.message, stack: err.stack }, 'Failed to start server')
  process.exit(1)
})
