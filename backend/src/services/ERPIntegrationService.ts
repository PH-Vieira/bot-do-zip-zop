import { baileysManager } from '../baileys/BaileysManager.js'
import { logger } from '../config/logger.js'

/**
 * Exemplo de serviço de integração com ERP
 * Pode ser expandido para sincronizar contatos, disparar mensagens por eventos, etc.
 */

export class ERPIntegrationService {
  /**
   * Sincroniza contatos do ERP com o WhatsApp
   */
  async syncContactsFromERP(sessionId: string, erpContacts: any[]) {
    const sock = baileysManager.getSession(sessionId)
    if (!sock) {
      throw new Error('Session not found')
    }

    logger.info({ sessionId, count: erpContacts.length }, 'Syncing contacts from ERP')

    // Aqui você pode implementar a lógica de sincronização
    // Ex: buscar contatos do ERP e validar se existem no WhatsApp
    for (const contact of erpContacts) {
      const phone = contact.whatsapp || contact.phone
      if (phone) {
        const jid = `${phone}@s.whatsapp.net`
        // Validar se existe no WhatsApp
        const result = await sock.onWhatsApp(jid)
        const exists = Array.isArray(result) ? (result[0]?.exists === true) : false
        logger.info({ phone, exists }, 'Contact validated')
      }
    }
  }

  /**
   * Dispara mensagem via evento do ERP (ex: pedido aprovado)
   */
  async triggerMessageFromERPEvent(sessionId: string, event: any) {
    const sock = baileysManager.getSession(sessionId)
    if (!sock) {
      throw new Error('Session not found')
    }

    const { eventType, customerId, customerPhone, message } = event

    logger.info({ sessionId, eventType, customerId }, 'Triggering message from ERP event')

    const jid = `${customerPhone}@s.whatsapp.net`
    await sock.sendMessage(jid, { text: message })

    logger.info({ sessionId, jid }, 'ERP event message sent')
  }

  /**
   * Retorna contexto do ERP para um chat (ex: pedidos do cliente)
   */
  async getChatContextFromERP(chatId: string) {
    // Aqui você busca dados do ERP relacionados ao cliente
    // Ex: buscar pedidos, histórico, etc. usando o número do WhatsApp

    const phone = chatId.split('@')[0]

    // Mock de dados do ERP
    return {
      customerId: '12345',
      customerName: 'Cliente Exemplo',
      phone,
      orders: [
        { id: 'PED001', status: 'approved', total: 150.00 },
        { id: 'PED002', status: 'pending', total: 320.00 }
      ],
      lastInteraction: new Date()
    }
  }
}

export const erpIntegrationService = new ERPIntegrationService()
