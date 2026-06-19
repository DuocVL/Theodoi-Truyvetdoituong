import { Queue } from 'bullmq';
import { redisConnection } from '../configs/redis.config';

const QUEUE_NAME = 'face-verification';

// We export a single instance of the queue
export const faceVerificationQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Try 3 times before failing
    backoff: {
      type: 'exponential',
      delay: 1000, // 1s, 2s, 4s
    },
  },
});
