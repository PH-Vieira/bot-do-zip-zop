import { FastifyInstance } from 'fastify'
import * as chatController from '../controllers/chat.controller.js'

export async function chatRoutes(fastify: FastifyInstance) {
  fastify.get('/:sessionId/contacts', chatController.getContacts)
  fastify.get('/:sessionId/chats', chatController.getChats)
  fastify.get('/:sessionId/chat/:chatId', chatController.getChatById)
}
