import { jidNormalizedUser } from '@whiskeysockets/baileys'

export function normalizeJid(jid: string): string {
  return jidNormalizedUser(jid)
}

export function isPrivateJid(jid: string): boolean {
  return jid.endsWith('@s.whatsapp.net') || jid.endsWith('@lid')
}

export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us')
}

export function extractPhone(jid: string): string {
  return jid.split('@')[0] || ''
}
