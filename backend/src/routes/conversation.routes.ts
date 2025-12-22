import { FastifyInstance } from 'fastify'
import * as conversationController from '../controllers/conversation.controller.js'

export async function conversationRoutes(fastify: FastifyInstance) {
  // Listar conversas
  fastify.get('/', conversationController.getConversations)
  
  // Mensagens de uma conversa
  fastify.get('/:id/messages', conversationController.getConversationMessages)
  
  // Marcar como lida
  fastify.post('/:id/read', conversationController.markConversationAsRead)
  
  // Atribuir usuário
  fastify.post('/:id/assign', conversationController.assignConversation)
  
  // Vincular cliente
  fastify.post('/:id/link-customer', conversationController.linkCustomer)
  
  // Encerrar
  fastify.post('/:id/close', conversationController.closeConversation)
  
  // Reabrir
  fastify.post('/:id/reopen', conversationController.reopenConversation)
  
  // Excluir
  fastify.delete('/:id', conversationController.deleteConversation)
}
