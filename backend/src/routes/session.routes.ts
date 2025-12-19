import { FastifyInstance } from 'fastify'
import * as sessionController from '../controllers/session.controller.js'

export async function sessionRoutes(fastify: FastifyInstance) {
  fastify.post('/start', sessionController.createSession)
  fastify.get('/list', sessionController.listSessions)
  fastify.get('/:sessionId/status', sessionController.getSessionStatus)
  fastify.post('/:sessionId/disconnect', sessionController.disconnectSession)
  fastify.delete('/:sessionId', sessionController.deleteSession)
}
