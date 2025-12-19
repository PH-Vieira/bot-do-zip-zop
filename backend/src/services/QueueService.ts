import { Queue, Worker } from 'bullmq'
import { redis } from '../config/redis.js'
import { baileysManager } from '../baileys/BaileysManager.js'
import { logger } from '../config/logger.js'

export const messageQueue = new Queue('messages', { connection: redis })

interface SendMessageJob {
  sessionId: string
  to: string
  message: any
}

export const messageWorker = new Worker<SendMessageJob>(
  'messages',
  async (job) => {
    const { sessionId, to, message } = job.data

    const sock = baileysManager.getSession(sessionId)
    if (!sock) {
      throw new Error('Session not found or not connected')
    }

    await sock.sendMessage(to, message)
    logger.info({ sessionId, to }, 'Message sent from queue')
  },
  {
    connection: redis,
    concurrency: 5,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 }
  }
)

messageWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed')
})

messageWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job failed')
})

export async function addMessageToQueue(data: SendMessageJob) {
  return await messageQueue.add('send-message', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  })
}
