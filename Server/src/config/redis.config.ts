
import IORedis from 'ioredis';

// This should be in your .env file
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redisConnection = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null, // This is important for BullMQ
});
