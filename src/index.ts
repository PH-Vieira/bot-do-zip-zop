import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  jidNormalizedUser
} from '@whiskeysockets/baileys'
import P from 'pino'
import qrcode from 'qrcode-terminal'
import type { WASocket } from '@whiskeysockets/baileys'

const startTime = Date.now()

// Frases inspiradoras
const FRASES = [
  '💡 "O sucesso é a soma de pequenos esforços repetidos dia após dia."',
  '💡 "Acredite em si mesmo e tudo será possível."',
  '💡 "O único modo de fazer um excelente trabalho é amar o que você faz."',
  '💡 "Não espere por oportunidades, crie-as."',
  '💡 "A persistência é o caminho do êxito."',
  '💡 "Grandes realizações exigem tempo e paciência."',
  '💡 "O fracasso é apenas a oportunidade de recomeçar com mais inteligência."',
  '💡 "Você é mais forte do que imagina."',
  '💡 "Cada dia é uma nova chance de melhorar."',
  '💡 "A diferença entre o impossível e o possível está na determinação."'
]

// Piadas
const PIADAS = [
  '😄 Por que o JavaScript foi ao psicólogo?\nPorque tinha muitos undefined feelings!',
  '😄 Qual é o café preferido do desenvolvedor?\nJava!',
  '😄 Por que o programador preferiu o escuro?\nPorque a luz atrai bugs!',
  '😄 O que um desenvolvedor faz no jardim?\nCultiva beans!',
  '😄 Por que arrays começam em 0?\nPorque programadores sempre querem começar do zero!',
  '😄 Como o programador resolve problemas?\nCtrl + C, Ctrl + V!',
  '😄 Qual é o esporte favorito do programador?\nBasquete, por causa dos hoops!',
  '😄 Por que o celular foi à escola?\nPara melhorar sua rede social!'
]

/**
 * Handler de comandos do bot
 */
async function handleCommand(command: string, sock: WASocket, jid: string) {
  const cmd = command.split(' ')[0].toLowerCase()

  switch (cmd) {
    case '/ajuda':
    case '/help':
      await handleAjuda(sock, jid)
      break
    
    case '/ping':
      await handlePing(sock, jid)
      break
    
    case '/status':
      await handleStatus(sock, jid)
      break
    
    case '/horario':
    case '/hora':
      await handleHorario(sock, jid)
      break
    
    case '/sobre':
    case '/info':
      await handleSobre(sock, jid)
      break
    
    case '/menu':
    case '/start':
        const text = getText(msg)

        if (!text) continue

        const normalized = text.trim().toLowerCase()
        
        // Detectar comandos (começam com /)
        if (normalized.startsWith('/')) {
          await handleCommand(normalized, sock, replyJid)
        }
      } catch (err) {
        console.error('message handler error', err)
      await handlePiada(sock, jid)
      break
    
    default:
      await handleUnknown(sock, jid, cmd)
      break
  }
}

async function handleAjuda(sock: WASocket, jid: string) {
  const message = `📋 *COMANDOS DISPONÍVEIS*

/ajuda - Mostra todos os comandos
/ping - Verifica se o bot responde
/status - Status e tempo online
/horario - Data e hora atual
/sobre - Informações do bot
/menu - Menu principal
/frase - Frase inspiradora
/piada - Piada aleatória

_Digite qualquer comando para começar!_`
  
  await sock.sendMessage(jid, { text: message })
}

async function handlePing(sock: WASocket, jid: string) {
  const start = Date.now()
  await sock.sendMessage(jid, { text: '🏓 Pong!' })
  const latency = Date.now() - start
  await sock.sendMessage(jid, { text: `⚡ Latência: ${latency}ms` })
}

async function handleStatus(sock: WASocket, jid: string) {
  const uptime = Date.now() - startTime
  const seconds = Math.floor(uptime / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  let uptimeText = ''
  if (days > 0) uptimeText += `${days}d `
  if (hours % 24 > 0) uptimeText += `${hours % 24}h `
  if (minutes % 60 > 0) uptimeText += `${minutes % 60}m `
  uptimeText += `${seconds % 60}s`

  const message = `✅ *STATUS DO BOT*

🟢 Online e funcionando
⏱️ Tempo online: ${uptimeText}
📱 Conexão: Ativa
🤖 Versão: 1.0.0`

  await sock.sendMessage(jid, { text: message })
}

async function handleHorario(sock: WASocket, jid: string) {
  const now = new Date()
  const date = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const time = now.toLocaleTimeString('pt-BR')

  const message = `🕐 *DATA E HORA*

📅 ${date}
⏰ ${time}`

  await sock.sendMessage(jid, { text: message })
}

async function handleSobre(sock: WASocket, jid: string) {
  const message = `🤖 *SOBRE O BOT*

Nome: Bot do Zip Zop
Versão: 1.0.0
Desenvolvido com: Node.js + Baileys

📌 *Funcionalidades:*
• Responde a comandos em tempo real
• Funciona apenas em conversas privadas
• Comandos úteis e práticos
• Interface em português

Digite /ajuda para ver todos os comandos!`

  await sock.sendMessage(jid, { text: message })
}

async function handleMenu(sock: WASocket, jid: string) {
  const message = `🏠 *MENU PRINCIPAL*

Escolha uma opção:

1️⃣ /ajuda - Ver comandos
2️⃣ /status - Status do bot
3️⃣ /horario - Data e hora
4️⃣ /frase - Frase inspiradora
5️⃣ /piada - Receber uma piada
6️⃣ /sobre - Sobre o bot

_Digite o comando desejado!_`

  await sock.sendMessage(jid, { text: message })
}

async function handleFrase(sock: WASocket, jid: string) {
  const frase = FRASES[Math.floor(Math.random() * FRASES.length)]
  await sock.sendMessage(jid, { text: frase })
}

async function handlePiada(sock: WASocket, jid: string) {
  const piada = PIADAS[Math.floor(Math.random() * PIADAS.length)]
  await sock.sendMessage(jid, { text: piada })
}

async function handleUnknown(sock: WASocket, jid: string, command: string) {
  const message = `❓ Comando "${command}" não encontrado.

Digite /ajuda para ver todos os comandos disponíveis.`

  await sock.sendMessage(jid, { text: message })
}

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
