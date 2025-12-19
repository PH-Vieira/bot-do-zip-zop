import { FastifyRequest, FastifyReply } from 'fastify'
import { baileysManager } from '../baileys/BaileysManager.js'
import { prisma } from '../config/database.js'
import { normalizeJid } from '../utils/jid.js'

interface SendMessageBody {
  sessionId: string
  to: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document'
  content: any
}

export async function sendMessage(
  req: FastifyRequest<{ Body: SendMessageBody }>,
  reply: FastifyReply
) {
  try {
    const { sessionId, to, type, content } = req.body

    const sock = baileysManager.getSession(sessionId)
    if (!sock) {
      return reply.status(404).send({ error: 'Session not found or not connected' })
    }

    const toJid = normalizeJid(to)
    let message: any

    switch (type) {
      case 'text':
        message = { text: content.text }
        break
      case 'image':
        message = { image: { url: content.url }, caption: content.caption }
        break
      case 'video':
        message = { video: { url: content.url }, caption: content.caption }
        break
      case 'audio':
        message = { audio: { url: content.url }, mimetype: 'audio/mp4' }
        break
      case 'document':
        message = {
          document: { url: content.url },
          fileName: content.fileName,
          mimetype: content.mimetype
        }
        break
      default:
        return reply.status(400).send({ error: 'Invalid message type' })
    }

    const result = await sock.sendMessage(toJid, message)

    reply.send({
      success: true,
      messageId: result?.key?.id,
      timestamp: result?.messageTimestamp
    })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}

export async function getMessages(
  req: FastifyRequest<{
    Params: { sessionId: string }
    Querystring: { chatId?: string; limit?: string; offset?: string }
  }>,
  reply: FastifyReply
) {
  try {
    const { sessionId } = req.params
    const { chatId, limit = '50', offset = '0' } = req.query

    const where: any = { sessionId }
    if (chatId) {
      where.chatId = normalizeJid(chatId)
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    })

    reply.send({ messages })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}

export async function markAsRead(
  req: FastifyRequest<{
    Body: { sessionId: string; chatId: string; messageIds: string[] }
  }>,
  reply: FastifyReply
) {
  try {
    const { sessionId, chatId, messageIds } = req.body

    const sock = baileysManager.getSession(sessionId)
    if (!sock) {
      return reply.status(404).send({ error: 'Session not found' })
    }

    const chatJid = normalizeJid(chatId)
    
    for (const msgId of messageIds) {
      await sock.readMessages([{ remoteJid: chatJid, id: msgId, fromMe: false }])
    }

    // Update chat unread count
    await prisma.chat.update({
      where: {
        sessionId_chatId: {
          sessionId,
          chatId: chatJid
        }
      },
      data: { unreadCount: 0 }
    })

    reply.send({ success: true })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}

export async function deleteMessage(
  req: FastifyRequest<{
    Body: { sessionId: string; chatId: string; messageId: string }
  }>,
  reply: FastifyReply
) {
  try {
    const { sessionId, chatId, messageId } = req.body

    const sock = baileysManager.getSession(sessionId)
    if (!sock) {
      return reply.status(404).send({ error: 'Session not found' })
    }

    await sock.sendMessage(normalizeJid(chatId), { delete: { remoteJid: normalizeJid(chatId), id: messageId, fromMe: true } })

    reply.send({ success: true })
  } catch (err: any) {
    reply.status(500).send({ error: err.message })
  }
}
