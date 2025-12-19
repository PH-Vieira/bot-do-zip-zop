import { FastifyRequest, FastifyReply } from 'fastify'
import { baileysManager } from '../baileys/BaileysManager.js'
import { prisma } from '../config/database.js'
import { nanoid } from 'nanoid'

export async function createSession(req: FastifyRequest, reply: FastifyReply) {
  try {
    const sessionId = nanoid(10)
    const session = await baileysManager.createSession(sessionId)
    reply.send({ success: true, sessionId: session.sessionId })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}

export async function getSessionStatus(
  req: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply
) {
  try {
    const { sessionId } = req.params
    const session = await prisma.session.findUnique({ where: { id: sessionId } })

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' })
    }

    const isActive = baileysManager.isSessionActive(sessionId)

    reply.send({
      sessionId: session.id,
      status: session.status,
      phone: session.phone,
      isActive,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}

export async function disconnectSession(
  req: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply
) {
  try {
    const { sessionId } = req.params
    await baileysManager.disconnect(sessionId)
    reply.send({ success: true, message: 'Session disconnected' })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}

export async function deleteSession(
  req: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply
) {
  try {
    const { sessionId } = req.params
    await baileysManager.disconnect(sessionId)
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {})
    reply.send({ success: true, message: 'Session deleted' })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}

export async function listSessions(req: FastifyRequest, reply: FastifyReply) {
  try {
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    })
    reply.send({ sessions })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}
