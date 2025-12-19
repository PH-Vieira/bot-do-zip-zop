import { AuthenticationCreds, SignalDataTypeMap, initAuthCreds, BufferJSON } from '@whiskeysockets/baileys'
import { prisma } from '../config/database.js'
import { logger } from '../config/logger.js'

export class SessionStore {
  private sessionId: string

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  async loadAuthState(): Promise<{ state: any; saveCreds: () => Promise<void> }> {
    const session = await prisma.session.findUnique({
      where: { id: this.sessionId }
    })

    let creds: AuthenticationCreds
    let keys: any = {}

    if (session?.authState) {
      const authData = session.authState as any
      creds = authData.creds || initAuthCreds()
      keys = authData.keys || {}
    } else {
      creds = initAuthCreds()
      await prisma.session.upsert({
        where: { id: this.sessionId },
        create: {
          id: this.sessionId,
          status: 'disconnected',
          authState: { creds, keys }
        },
        update: {}
      })
    }

    const saveCreds = async () => {
      await prisma.session.update({
        where: { id: this.sessionId },
        data: {
          authState: { creds, keys },
          updatedAt: new Date()
        }
      })
    }

    return {
      state: {
        creds,
        keys: {
          get: (type: keyof SignalDataTypeMap, ids: string[]) => {
            const data: any = {}
            for (const id of ids) {
              const value = keys[`${type}-${id}`]
              if (value) {
                data[id] = typeof value === 'string' ? JSON.parse(value, BufferJSON.reviver) : value
              }
            }
            return data
          },
          set: (data: any) => {
            for (const category in data) {
              for (const id in data[category]) {
                const value = data[category][id]
                const key = `${category}-${id}`
                if (value) {
                  keys[key] = JSON.stringify(value, BufferJSON.replacer)
                } else {
                  delete keys[key]
                }
              }
            }
            saveCreds().catch(err => logger.error({ err }, 'Failed to save creds'))
          }
        }
      },
      saveCreds
    }
  }

  async updateStatus(status: string, phone?: string) {
    await prisma.session.update({
      where: { id: this.sessionId },
      data: { status, phone, updatedAt: new Date() }
    })
  }

  async deleteSession() {
    await prisma.session.delete({
      where: { id: this.sessionId }
    }).catch(() => {})
  }
}
