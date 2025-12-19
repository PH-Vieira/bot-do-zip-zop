import makeWASocket, {
  DisconnectReason,
  WASocket,
  BaileysEventMap,
  Contact as BaileysContact
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import P from 'pino'
import { EventEmitter } from 'events'
import { SessionStore } from './SessionStore.js'
import { MessageHandler } from './MessageHandler.js'
import { logger } from '../config/logger.js'
import { generateQRDataURL } from '../utils/qr.js'

export interface SessionInfo {
  sessionId: string
  status: 'connecting' | 'open' | 'closed'
  qr?: string
  phone?: string
}

export class BaileysManager extends EventEmitter {
  private sessions = new Map<string, WASocket>()
  private messageHandlers = new Map<string, MessageHandler>()

  async createSession(sessionId: string): Promise<SessionInfo> {
    if (this.sessions.has(sessionId)) {
      throw new Error('Session already exists')
    }

    const store = new SessionStore(sessionId)
    const { state, saveCreds } = await store.loadAuthState()

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: P({ level: 'error' }), // reduce noise
      markOnlineOnConnect: false,
      syncFullHistory: false,
      browser: ['WhatsApp API', 'Chrome', '1.0.0']
    })

    this.sessions.set(sessionId, sock)

    const messageHandler = new MessageHandler(sessionId, sock)
    this.messageHandlers.set(sessionId, messageHandler)

    // Forward message events to main emitter
    messageHandler.on('message.received', (data) => this.emit('message.received', data))
    messageHandler.on('message.updated', (data) => this.emit('message.updated', data))

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        const qrDataURL = await generateQRDataURL(qr)
        this.emit('qr', { sessionId, qr: qrDataURL })
        await store.updateStatus('connecting')
      }

      if (connection === 'open') {
        const phone = sock.user?.id ? sock.user.id.split(':')[0] : undefined
        await store.updateStatus('open', phone)
        this.emit('connected', { sessionId, phone })
        logger.info({ sessionId, phone }, 'Session connected')
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        await store.updateStatus('closed')
        this.emit('disconnected', { sessionId, shouldReconnect })
        
        this.sessions.delete(sessionId)
        this.messageHandlers.delete(sessionId)

        if (shouldReconnect) {
          logger.info({ sessionId, statusCode }, 'Reconnecting session...')
          setTimeout(() => this.createSession(sessionId), 5000)
        } else {
          logger.info({ sessionId }, 'Session logged out')
          await store.deleteSession()
        }
      }
    })

    sock.ev.on('creds.update', saveCreds)

    return {
      sessionId,
      status: 'connecting',
      qr: undefined,
      phone: undefined
    }
  }

  getSession(sessionId: string): WASocket | undefined {
    return this.sessions.get(sessionId)
  }

  getMessageHandler(sessionId: string): MessageHandler | undefined {
    return this.messageHandlers.get(sessionId)
  }

  async disconnect(sessionId: string): Promise<void> {
    const sock = this.sessions.get(sessionId)
    if (sock) {
      await sock.logout()
      this.sessions.delete(sessionId)
      this.messageHandlers.delete(sessionId)
    }
  }

  getAllSessions(): string[] {
    return Array.from(this.sessions.keys())
  }

  isSessionActive(sessionId: string): boolean {
    return this.sessions.has(sessionId)
  }
}

export const baileysManager = new BaileysManager()
