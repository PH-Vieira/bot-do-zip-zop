import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  jidNormalizedUser
} from '@whiskeysockets/baileys'
import P from 'pino'
import qrcode from 'qrcode-terminal'

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

  const sock = makeWASocket({
    auth: state,
    // handle QR in connection.update
    browser: Browsers.ubuntu('Bot Zip Zop'),
    markOnlineOnConnect: false,
    logger: P({ level: 'debug' })
  })

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (update.qr) {
      console.log('QR code received, scan with WhatsApp:')
      qrcode.generate(update.qr, { small: true })
    }
    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      console.log('connection closed', { statusCode, shouldReconnect })
      if (shouldReconnect) {
        start()
      }
    } else if (connection === 'open') {
      console.log('opened connection')
    }
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async (event) => {
    for (const m of event.messages) {
      try {
        // ignore our own messages
        if (m.key.fromMe) continue

        const remoteJid = m.key.remoteJid
        if (!remoteJid) continue

        // Private chats can come as PN (@s.whatsapp.net) or LID (@lid) in v7
        const isPrivate = remoteJid.endsWith('@s.whatsapp.net') || remoteJid.endsWith('@lid')
        if (!isPrivate) continue

        const replyJid = jidNormalizedUser(remoteJid)

        const msg = m.message
        if (!msg) continue

        // extract text (handles normal, extended, and ephemeral wrappers)
        const getText = (message: any): string | undefined => {
          return (
            message?.conversation ||
            message?.extendedTextMessage?.text ||
            message?.ephemeralMessage?.message?.conversation ||
            message?.ephemeralMessage?.message?.extendedTextMessage?.text ||
            message?.viewOnceMessage?.message?.conversation ||
            message?.viewOnceMessage?.message?.extendedTextMessage?.text
          )?.toString()
        }

        const text = getText(msg)

        if (!text) continue

        const normalized = text.trim().toLowerCase()
        if (normalized === 'ping') {
          await sock.sendMessage(replyJid, { text: 'pong' })
        }
      } catch (err) {
        console.error('message handler error', err)
      }
    }
  })
}

start().catch((err) => {
  console.error('fatal error', err)
  process.exit(1)
})
