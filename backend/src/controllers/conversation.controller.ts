import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../config/database.js'
import { logger } from '../config/logger.js'

// GET /api/conversations - Listar todas as conversas
export async function getConversations(
  req: FastifyRequest<{ Querystring: { sessionId?: string; status?: string; assignedTo?: string } }>,
  reply: FastifyReply
) {
  try {
    const { sessionId, status, assignedTo } = req.query

    const where: any = {}
    
    if (sessionId) {
      where.sessionId = sessionId
    }
    
    if (status) {
      where.status = status
    }
    
    if (assignedTo) {
      where.assignedTo = assignedTo
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        chat: {
          select: {
            name: true,
            isGroup: true,
            profilePicUrl: true
          }
        }
      }
    })

    // Mapear para o formato esperado pelo frontend
    const mapped = conversations.map((conv) => ({
      id: conv.id,
      chat_id: conv.chatId,
      contact_name: conv.contactName || conv.chat.name,
      contact_phone: conv.contactPhone,
      profile_pic_url: conv.profilePicUrl || conv.chat.profilePicUrl,
      customer_id: conv.customerId,
      assigned_to: conv.assignedTo,
      status: conv.status,
      unread_count: conv.unreadCount,
      last_message_at: conv.lastMessageAt?.toISOString() || null,
      last_message_preview: conv.lastMessagePreview,
    }))

    reply.send({ conversations: mapped })
  } catch (err: any) {
    logger.error('Erro ao buscar conversas:', err)
    reply.status(500).send({ error: err.message })
  }
}

// GET /api/conversations/:id/messages - Mensagens de uma conversa
export async function getConversationMessages(
  req: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: string; offset?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params
    const limit = parseInt(req.query.limit || '100')
    const offset = parseInt(req.query.offset || '0')

    const conversation = await prisma.conversation.findUnique({
      where: { id }
    })

    if (!conversation) {
      return reply.status(404).send({ error: 'Conversa não encontrada' })
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId: conversation.chatId,
        sessionId: conversation.sessionId
      },
      orderBy: { timestamp: 'asc' },
      skip: offset,
      take: limit
    })

    // Mapear para formato esperado pelo frontend
    const mapped = messages.map((msg) => ({
      id: String(msg.id),
      conversation_id: id,
      message_id: msg.messageId,
      from_me: msg.isFromMe,
      sender_id: msg.fromJid,
      type: msg.type,
      content: msg.content,
      status: msg.status,
      timestamp: new Date(Number(msg.timestamp)).toISOString(),
    }))

    reply.send({ messages: mapped })
  } catch (err: any) {
    logger.error('Erro ao buscar mensagens da conversa:', err)
    reply.status(500).send({ error: err.message })
  }
}

// POST /api/conversations/:id/read - Marcar como lida
export async function markConversationAsRead(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params

    await prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 }
    })

    reply.send({ success: true })
  } catch (err: any) {
    logger.error('Erro ao marcar conversa como lida:', err)
    reply.status(500).send({ error: err.message })
  }
}

// POST /api/conversations/:id/assign - Atribuir usuário
export async function assignConversation(
  req: FastifyRequest<{ Params: { id: string }; Body: { userId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params
    const { userId } = req.body

    await prisma.conversation.update({
      where: { id },
      data: { 
        assignedTo: userId,
        status: 'in_progress'
      }
    })

    reply.send({ success: true })
  } catch (err: any) {
    logger.error('Erro ao atribuir conversa:', err)
    reply.status(500).send({ error: err.message })
  }
}

// POST /api/conversations/:id/link-customer - Vincular cliente
export async function linkCustomer(
  req: FastifyRequest<{ Params: { id: string }; Body: { customerId: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params
    const { customerId } = req.body

    await prisma.conversation.update({
      where: { id },
      data: { customerId }
    })

    reply.send({ success: true })
  } catch (err: any) {
    logger.error('Erro ao vincular cliente:', err)
    reply.status(500).send({ error: err.message })
  }
}

// POST /api/conversations/:id/close - Encerrar conversa
export async function closeConversation(
  req: FastifyRequest<{ Params: { id: string }; Body: { reason?: string; closedBy?: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params
    const { reason, closedBy } = req.body

    await prisma.conversation.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        closedBy: closedBy || null,
        closeReason: reason || 'manual'
      }
    })

    reply.send({ success: true })
  } catch (err: any) {
    logger.error('Erro ao encerrar conversa:', err)
    reply.status(500).send({ error: err.message })
  }
}

// POST /api/conversations/:id/reopen - Reabrir conversa
export async function reopenConversation(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params

    await prisma.conversation.update({
      where: { id },
      data: {
        status: 'open',
        closedAt: null,
        closedBy: null,
        closeReason: null
      }
    })

    reply.send({ success: true })
  } catch (err: any) {
    logger.error('Erro ao reabrir conversa:', err)
    reply.status(500).send({ error: err.message })
  }
}

// DELETE /api/conversations/:id - Excluir conversa
export async function deleteConversation(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params

    await prisma.conversation.delete({
      where: { id }
    })

    reply.send({ success: true })
  } catch (err: any) {
    logger.error('Erro ao excluir conversa:', err)
    reply.status(500).send({ error: err.message })
  }
}

// Função auxiliar: criar ou atualizar conversation automaticamente quando um chat recebe mensagem
export async function syncConversationFromChat(sessionId: string, chatId: string) {
  try {
    const chat = await prisma.chat.findUnique({
      where: {
        sessionId_chatId: { sessionId, chatId }
      },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    })

    if (!chat) {
      logger.warn(`Chat ${chatId} não encontrado para sincronizar conversation`)
      return
    }

    const lastMessage = chat.messages[0]
    const lastMessagePreview = lastMessage?.content?.text || 
                               (lastMessage?.type === 'image' ? '📷 Imagem' : 
                                lastMessage?.type === 'video' ? '🎥 Vídeo' : 
                                lastMessage?.type === 'audio' ? '🎵 Áudio' : 
                                'Mensagem')

    const contactPhone = chatId.replace('@s.whatsapp.net', '').replace('@g.us', '')

    await prisma.conversation.upsert({
      where: {
        chatId_sessionId: { chatId, sessionId }
      },
      update: {
        contactName: chat.name,
        profilePicUrl: chat.profilePicUrl,
        unreadCount: chat.unreadCount,
        lastMessageAt: lastMessage ? new Date(Number(lastMessage.timestamp)) : null,
        lastMessagePreview
      },
      create: {
        chatId,
        sessionId,
        contactName: chat.name,
        contactPhone,
        profilePicUrl: chat.profilePicUrl,
        unreadCount: chat.unreadCount,
        lastMessageAt: lastMessage ? new Date(Number(lastMessage.timestamp)) : null,
        lastMessagePreview,
        status: 'open'
      }
    })

    logger.debug(`Conversation sincronizada para chat ${chatId}`)
  } catch (err: any) {
    logger.error(`Erro ao sincronizar conversation do chat ${chatId}:`, err)
  }
}
