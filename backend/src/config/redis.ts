import Redis from 'ioredis'
import { config } from './env.js'

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null
})
