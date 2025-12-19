import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../config/database.js'

export async function getContacts(
  req: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply
) {
  try {
    const { sessionId } = req.params

    const contacts = await prisma.contact.findMany({
      where: { sessionId },
      orderBy: { updatedAt: 'desc' }
    })

    reply.send({ contacts })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}

export async function getChats(
  req: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply
) {
  try {
    const { sessionId } = req.params

    const chats = await prisma.chat.findMany({
      where: { sessionId },
      orderBy: { lastMessageTime: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    reply.send({ chats })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}

export async function getChatById(
  req: FastifyRequest<{ Params: { sessionId: string; chatId: string } }>,
  reply: FastifyReply
) {
  try {
    const { sessionId, chatId } = req.params

    const chat = await prisma.chat.findUnique({
      where: {
        sessionId_chatId: {
          sessionId,
          chatId
        }
      },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 50
        }
      }
    })

    if (!chat) {
      return reply.status(404).send({ error: 'Chat not found' })
    }

    reply.send({ chat })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}
