
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '../../generated/prisma';
import { redisConnection } from '../config/redis.config';
import FaceService from '../services/face.service';

const QUEUE_NAME = 'face-verification';

const prisma = new PrismaClient();
const faceService = new FaceService();

interface FaceVerificationJobData {
    checkinId: bigint;
    subjectId: string;
    files: { 
        buffer: string; // base64 encoded buffer
        originalname: string;
        mimetype: string;
    }[];
}

const processJob = async (job: Job<FaceVerificationJobData>) => {
    const { checkinId, subjectId, files } = job.data;
    console.log(`[Worker] Processing job ${job.id} for check-in ${checkinId}`);

    try {
        // 1. Fetch the stored embedding for the subject
        const faceData = await prisma.faceData.findFirst({
            where: { subject_id: subjectId, status: 'ACTIVE' },
            orderBy: { created_at: 'desc' },
        });

        if (!faceData || !faceData.embedding) {
            throw new Error(`No registered face data found for subject ${subjectId}`);
        }

        const storedEmbedding = faceData.embedding as unknown as number[];

        // Convert base64 back to buffer for the service
        const imageFiles: Express.Multer.File[] = files.map(f => ({
            buffer: Buffer.from(f.buffer, 'base64'),
            originalname: f.originalname,
            mimetype: f.mimetype,
        })) as Express.Multer.File[];

        // 2. Call the face verification service
        const verificationResult = await faceService.verifyFace(imageFiles, storedEmbedding);

        const confidence = verificationResult.matched ? (1 - verificationResult.avg_distance) : 0;

        // 3. Update the check-in record with the result
        await prisma.checkin.update({
            where: { id: checkinId },
            data: {
                face_verified: verificationResult.matched,
                confidence: confidence,
                status: 'COMPLETED',
                image_url: verificationResult.reason // Store reason if verification failed
            }
        });
        
        console.log(`[Worker] Job ${job.id} completed successfully for check-in ${checkinId}`);

    } catch (error) {
        console.error(`[Worker] Job ${job.id} failed for check-in ${checkinId}:`, error.message);
        // Update the record to reflect the failure
        await prisma.checkin.update({
            where: { id: checkinId },
            data: {
                status: 'FAILED',
                image_url: error.message // Store error message
            }
        });
        // Re-throw the error to let BullMQ handle the retry logic
        throw error;
    }
};

// Initialize the worker
export const faceVerificationWorker = new Worker<FaceVerificationJobData>(QUEUE_NAME, processJob, {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
});

console.log('[Worker] Face verification worker started.');

faceVerificationWorker.on('completed', job => {
  console.log(`[Worker] Job ${job.id} has completed.`);
});

faceVerificationWorker.on('failed', (job, err) => {
  console.log(`[Worker] Job ${job.id} has failed with ${err.message}.`);
});

