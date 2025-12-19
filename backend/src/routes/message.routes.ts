import { FastifyInstance } from 'fastify'
import * as messageController from '../controllers/message.controller.js'

export async function messageRoutes(fastify: FastifyInstance) {
  fastify.post('/send', messageController.sendMessage)
  fastify.get('/:sessionId', messageController.getMessages)
  fastify.post('/mark-read', messageController.markAsRead)
  fastify.delete('/delete', messageController.deleteMessage)
}
