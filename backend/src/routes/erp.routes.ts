import { FastifyInstance } from 'fastify'
import { erpIntegrationService } from '../services/ERPIntegrationService.js'

export async function erpRoutes(fastify: FastifyInstance) {
  // Webhook de evento do ERP
  fastify.post('/trigger-message', async (req, reply) => {
    try {
      const body = req.body as any
      const { sessionId, eventType, customerId, customerPhone, message } = body

      await erpIntegrationService.triggerMessageFromERPEvent(sessionId, {
        eventType,
        customerId,
        customerPhone,
        message
      })

      reply.send({ success: true })
    } catch (err: any) {
      reply.status(500).send({ error: err.message })
    }
  })

  // Sincronizar contatos do ERP
  fastify.post('/sync-contacts', async (req, reply) => {
    try {
      const body = req.body as any
      const { sessionId, contacts } = body

      await erpIntegrationService.syncContactsFromERP(sessionId, contacts)

      reply.send({ success: true })
    } catch (err: any) {
      reply.status(500).send({ error: err.message })
    }
  })

  // Buscar contexto do ERP para um chat
  fastify.get('/chat-context/:chatId', async (req, reply) => {
    try {
      const { chatId } = req.params as any
      const context = await erpIntegrationService.getChatContextFromERP(chatId)

      reply.send({ context })
    } catch (err: any) {
      reply.status(500).send({ error: err.message })
    }
  })
}
