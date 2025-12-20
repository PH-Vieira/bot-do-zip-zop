import { WASocket, proto, WAMessage } from '@whiskeysockets/baileys'
import { EventEmitter } from 'events'
import { prisma } from '../config/database.js'
import { normalizeJid, isPrivateJid, isGroupJid } from '../utils/jid.js'
import { logger } from '../config/logger.js'

export class MessageHandler extends EventEmitter {
  private sessionId: string
  private sock: WASocket

  constructor(sessionId: string, sock: WASocket) {
    super()
    this.sessionId = sessionId
    this.sock = sock
    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      for (const msg of messages) {
        await this.handleMessage(msg)
      }
      this.emit('message.received', { sessionId: this.sessionId, messages, type })
    })

    this.sock.ev.on('messages.update', async (updates) => {
      for (const update of updates) {
        await this.handleMessageUpdate(update)
      }
      this.emit('message.updated', { sessionId: this.sessionId, updates })
    })

    this.sock.ev.on('contacts.update', async (contacts) => {
      await this.handleContactsUpdate(contacts)
    })

    this.sock.ev.on('chats.upsert', async (chats) => {
      await this.handleChatsUpsert(chats)
    })
  }

  private async handleMessage(msg: WAMessage) {
    try {
      if (!msg.key.remoteJid || !msg.message) return

      const remoteJid = normalizeJid(msg.key.remoteJid)
      const messageId = msg.key.id || ''
      const fromJid = msg.key.fromMe ? this.sock.user?.id || '' : remoteJid
      const toJid = msg.key.fromMe ? remoteJid : this.sock.user?.id || ''
      const chatId = remoteJid
      const timestamp = this.toBigIntTimestamp(msg.messageTimestamp)

      // Extract message type and content
      const { type, content } = this.extractMessageContent(msg.message)

      await prisma.message.upsert({
        where: { messageId },
        create: {
          sessionId: this.sessionId,
          messageId,
          fromJid,
          toJid,
          chatId,
          type,
          content,
          timestamp,
          isFromMe: msg.key.fromMe || false,
          status: 'sent'
        },
        update: {
          content,
          status: 'sent'
        }
      })

      // Update chat
      await prisma.chat.upsert({
        where: {
          sessionId_chatId: {
            sessionId: this.sessionId,
            chatId
          }
        },
        create: {
          sessionId: this.sessionId,
          chatId,
          isGroup: isGroupJid(chatId),
          lastMessageTime: timestamp,
          unreadCount: msg.key.fromMe ? 0 : 1
        },
        update: {
          lastMessageTime: timestamp,
          unreadCount: msg.key.fromMe ? 0 : { increment: 1 }
        }
      })
    } catch (err) {
      logger.error({ err, sessionId: this.sessionId }, 'Failed to handle message')
    }
  }

  private async handleMessageUpdate(update: any) {
    try {
      const { key, update: updateData } = update
      if (!key.id) return

      const status = updateData.status === 3 ? 'read' : updateData.status === 2 ? 'delivered' : 'sent'

      await prisma.message.updateMany({
        where: {
          sessionId: this.sessionId,
          messageId: key.id
        },
        data: { status }
      })
    } catch (err) {
      logger.error({ err }, 'Failed to handle message update')
    }
  }

  private async handleContactsUpdate(contacts: any[]) {
    try {
      for (const contact of contacts) {
        if (!contact.id) continue

        await prisma.contact.upsert({
          where: {
            sessionId_jid: {
              sessionId: this.sessionId,
              jid: normalizeJid(contact.id)
            }
          },
          create: {
            sessionId: this.sessionId,
            jid: normalizeJid(contact.id),
            name: contact.name || contact.notify,
            pushName: contact.notify
          },
          update: {
            name: contact.name || contact.notify,
            pushName: contact.notify
          }
        })
      }
    } catch (err) {
      logger.error({ err }, 'Failed to handle contacts update')
    }
  }

  private async handleChatsUpsert(chats: any[]) {
    try {
      for (const chat of chats) {
        if (!chat.id) continue

        await prisma.chat.upsert({
          where: {
            sessionId_chatId: {
              sessionId: this.sessionId,
              chatId: normalizeJid(chat.id)
            }
          },
          create: {
            sessionId: this.sessionId,
            chatId: normalizeJid(chat.id),
            name: chat.name,
            isGroup: isGroupJid(chat.id),
            unreadCount: chat.unreadCount || 0,
            archived: chat.archived || false,
            pinned: chat.pinned || false,
            muted: chat.mute ? true : false
          },
          update: {
            name: chat.name,
            unreadCount: chat.unreadCount || 0,
            archived: chat.archived || false,
            pinned: chat.pinned || false,
            muted: chat.mute ? true : false
          }
        })
      }
    } catch (err) {
      logger.error({ err }, 'Failed to handle chats upsert')
    }
  }

  private extractMessageContent(message: proto.IMessage): { type: string; content: any } {
    if (message.conversation) {
      return { type: 'text', content: { text: message.conversation } }
    }
    if (message.extendedTextMessage) {
      return { type: 'text', content: { text: message.extendedTextMessage.text } }
    }
    if (message.imageMessage) {
      return {
        type: 'image',
        content: {
          caption: message.imageMessage.caption,
          url: message.imageMessage.url,
          mimetype: message.imageMessage.mimetype
        }
      }
    }
    if (message.videoMessage) {
      return {
        type: 'video',
        content: {
          caption: message.videoMessage.caption,
          url: message.videoMessage.url,
          mimetype: message.videoMessage.mimetype
        }
      }
    }
    if (message.audioMessage) {
      return {
        type: 'audio',
        content: {
          url: message.audioMessage.url,
          mimetype: message.audioMessage.mimetype
        }
      }
    }
    if (message.documentMessage) {
      return {
        type: 'document',
        content: {
          fileName: message.documentMessage.fileName,
          url: message.documentMessage.url,
          mimetype: message.documentMessage.mimetype
        }
      }
    }
    if (message.stickerMessage) {
      return {
        type: 'sticker',
        content: {
          url: message.stickerMessage.url,
          mimetype: message.stickerMessage.mimetype
        }
      }
    }

    return { type: 'unknown', content: message }
  }

  private toBigIntTimestamp(ts: any): bigint {
    try {
      if (ts && typeof ts === 'object' && typeof ts.toNumber === 'function') {
        return BigInt(ts.toNumber())
      }
      const n = Number(ts ?? Date.now())
      return BigInt(n)
    } catch {
      return BigInt(Date.now())
    }
  }
}
