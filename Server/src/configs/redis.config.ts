import { ConnectionOptions } from 'bullmq';
import { env } from './env';

/**
 * Phân tách REDIS_URL để lấy thông tin kết nối cho BullMQ
 * BullMQ yêu cầu thuộc tính maxRetriesPerRequest phải là null
 * để không xung đột với cơ chế retry nội bộ của nó.
 */
const redisUrl = new URL(env.REDIS_URL);

export const redisConnection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  username: redisUrl.username || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};
