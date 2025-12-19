import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || ''
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production'
  },
  storage: {
    mediaPath: process.env.MEDIA_STORAGE_PATH || './storage/media',
    authPath: process.env.BAILEYS_AUTH_PATH || './storage/auth'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  }
}
