import { FastifyRequest, FastifyReply } from 'fastify'
import { baileysManager } from '../baileys/BaileysManager.js'
import { prisma } from '../config/database.js'
import { nanoid } from 'nanoid'
import { logger } from '../config/logger.js'

export async function createSession(req: FastifyRequest, reply: FastifyReply) {
  try {
    logger.info('Creating new session...')
    const sessionId = nanoid(10)
    logger.info(`Generated sessionId: ${sessionId}`)
    
    const session = await baileysManager.createSession(sessionId)
    logger.info(`Session created successfully: ${session.sessionId}`)
    
    reply.send({ success: true, sessionId: session.sessionId })
  } catch (err: any) {
    logger.error({ error: err.message, stack: err.stack }, 'Failed to create session')
    reply.status(500).send({ error: err.message })
  }
}

export async function getSessionStatus(
  req: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply
) {
  // Extract sessionId outside try-catch to use in error logging
  const { sessionId } = req.params
  try {
    logger.info(`Getting status for session: ${sessionId}`)
    
    const session = await prisma.session.findUnique({ where: { id: sessionId } })

    if (!session) {
      logger.warn(`Session not found: ${sessionId}`)
      return reply.status(404).send({ error: 'Session not found' })
    }

    const isActive = baileysManager.isSessionActive(sessionId)
    logger.info(`Session ${sessionId} status: ${session.status}, active: ${isActive}`)

    reply.send({
      sessionId: session.id,
      status: session.status,
      phone: session.phone,
      isActive,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    })
  } catch (err: any) {
    logger.error({ error: err.message, stack: err.stack, sessionId }, 'Failed to get session status')
    reply.status(500).send({ error: err.message })
  }
}

export async function disconnectSession(
  req: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply
) {
  // Extract sessionId outside try-catch to use in error logging
  const { sessionId } = req.params
  try {
    logger.info(`Disconnecting session: ${sessionId}`)
    await baileysManager.disconnect(sessionId)
    logger.info(`Session disconnected: ${sessionId}`)
    reply.send({ success: true, message: 'Session disconnected' })
  } catch (err: any) {
    logger.error({ error: err.message, stack: err.stack, sessionId }, 'Failed to disconnect session')
    reply.status(500).send({ error: err.message })
  }
}

export async function deleteSession(
  req: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply
) {
  // Extract sessionId outside try-catch to use in error logging
  const { sessionId } = req.params
  try {
    logger.info(`Deleting session: ${sessionId}`)
    await baileysManager.disconnect(sessionId)
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
    logger.info(`Session deleted: ${sessionId}`)
    reply.send({ success: true, message: 'Session deleted' })
  } catch (err: any) {
    logger.error({ error: err.message, stack: err.stack, sessionId }, 'Failed to delete session')
    reply.status(500).send({ error: err.message })
  }
}

export async function listSessions(req: FastifyRequest, reply: FastifyReply) {
  try {
    logger.info('Listing all sessions')
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })
    logger.info(`Found ${sessions.length} sessions`)
    reply.send({ sessions })
  } catch (err: any) {
    logger.error({ error: err.message, stack: err.stack }, 'Failed to list sessions')
    reply.status(500).send({ error: err.message })
  }
}
