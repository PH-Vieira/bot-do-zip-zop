import makeWASocket, {
  DisconnectReason,
  WASocket,
  BaileysEventMap,
  Contact as BaileysContact,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
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
  private qrCodes = new Map<string, string>()

  async createSession(sessionId: string): Promise<SessionInfo> {
    if (this.sessions.has(sessionId)) {
      throw new Error('Session already exists')
    }

    const store = new SessionStore(sessionId)
    const { state, saveCreds } = await store.loadAuthState()

    // Fetch latest version of WA Web
    const { version, isLatest } = await fetchLatestBaileysVersion()
    logger.info({ version: version.join('.'), isLatest }, 'Using WA version')

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger as any)
      },
      printQRInTerminal: false,
      logger: P({ level: 'silent' }), // reduce noise
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

    // Use event processor pattern from official example
    sock.ev.process(async (events) => {
      // Connection updates
      if (events['connection.update']) {
        const update = events['connection.update']
        const { connection, lastDisconnect, qr } = update

        if (qr) {
          const qrDataURL = await generateQRDataURL(qr)
          this.qrCodes.set(sessionId, qrDataURL)
          this.emit('qr', { sessionId, qr: qrDataURL })
          await store.updateStatus('connecting')
          logger.info({ sessionId }, 'QR code generated')
        }

        if (connection === 'open') {
          const phone = sock.user?.id ? sock.user.id.split(':')[0] : undefined
          this.qrCodes.delete(sessionId)
          await store.updateStatus('open', phone)
          this.emit('connected', { sessionId, phone })
          logger.info({ sessionId, phone }, 'Session connected')
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut

          this.qrCodes.delete(sessionId)
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
      }

      // Credentials update
      if (events['creds.update']) {
        await saveCreds()
      }
    })

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

  getQRCode(sessionId: string): string | undefined {
    return this.qrCodes.get(sessionId)
  }
}

export const baileysManager = new BaileysManager()
