import { Worker, Job } from 'bullmq';
import { prisma } from '../configs/prisma';
// Đảm bảo file này tồn tại hoặc thay thế bằng connection trực tiếp
import { redisConnection } from '../configs/redis.config'; 
import faceService from '../services/face.service';
import * as facedataRepository from '../repositories/facedata.repository';
import { FaceData } from '../../generated/prisma/client';

const QUEUE_NAME = 'face-verification';

/**
 * Mở rộng interface FaceData vì Prisma không nhận diện được trường Unsupported("vector")
 */
interface FaceDataWithEmbedding extends FaceData {
  embedding: number[];
}

/**
 * Interface định nghĩa dữ liệu công việc xác thực khuôn mặt
 * Files được encode base64 để lưu vào Redis queue
 */
interface FaceVerificationJobData {
  checkinId: bigint;
  subjectId: string;
  files: {
    buffer: string;
    originalname: string;
    mimetype: string;
  }[];
}

/**
 * Hàm xử lý job xác thực khuôn mặt
 * 
 * Quy trình:
 * 1. Lấy embedding đã đăng ký của subject
 * 2. Gọi Python service để xác thực
 * 3. Cập nhật kết quả check-in
 * 4. Handle error và retry
 */
const processJob = async (job: Job<FaceVerificationJobData>) => {
  const { checkinId, subjectId, files } = job.data;
  console.log(`[FaceVerificationWorker] Processing job ${job.id} for check-in ${checkinId}`);

  let imageFiles: Express.Multer.File[] = [];

  try {
    /**
     * Bước 1: Lấy embedding được đăng ký gần nhất của subject
     * Cần status = ACTIVE để đảm bảo embedding hợp lệ
     */
    const faceData = await facedataRepository.getLatestActiveFaceData(subjectId) as FaceDataWithEmbedding | null;

    if (!faceData || !faceData.embedding) {
      throw new Error(`No registered face data found for subject ${subjectId}`);
    }

    const storedEmbedding = faceData.embedding;

    /**
     * Bước 2: Convert base64 buffer trở lại Buffer object
     * Vì Redis queue không thể lưu Buffer trực tiếp
     */
    imageFiles = files.map((f) => ({
      buffer: Buffer.from(f.buffer, 'base64'),
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: 0,
      destination: '',
      fieldname: 'files',
      encoding: '7bit',
    })) as Express.Multer.File[];

    /**
     * Bước 3: Gọi face service để xác thực
     * Trả về { matched, avg_distance, reason }
     */
    const verificationResult = await faceService.verifyFace(imageFiles, storedEmbedding);

    /**
     * Bước 4: Tính confidence score
     * matched = true: confidence = 1 - distance (0-1)
     * matched = false: confidence = 0
     */
    const confidence = verificationResult.matched
      ? Math.max(0, Math.min(1, 1 - verificationResult.avg_distance))
      : 0;

    /**
     * Bước 5: Cập nhật check-in record với kết quả xác thực
     */
    await prisma.checkin.update({
      where: { id: checkinId },
      data: {
        face_verified: verificationResult.matched,
        confidence: confidence,
        status: 'COMPLETED',
        verification_reason: verificationResult.reason || null,
      },
    });

    console.log(
      `[FaceVerificationWorker] Job ${job.id} completed successfully for check-in ${checkinId}`,
    );

  } catch (error) {
    /**
     * Error handling:
     * - Log lỗi chi tiết
     * - Cập nhật check-in status = FAILED
     * - Lưu error message
     * - Re-throw để BullMQ handle retry
     */
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(
      `[FaceVerificationWorker] Job ${job.id} failed for check-in ${checkinId}:`,
      errorMsg,
    );

    try {
      await prisma.checkin.update({
        where: { id: checkinId },
        data: {
          status: 'FAILED',
          verification_reason: `Verification failed: ${errorMsg}`,
        },
      });
    } catch (updateError) {
      console.error(
        `[FaceVerificationWorker] Failed to update check-in record: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`,
      );
    }

    throw error;
  }
};

/**
 * Khởi tạo worker process
 * 
 * Cấu hình:
 * - connection: Redis connection
 * - concurrency: Số job xử lý song song (5 jobs/time)
 * - defaultJobOptions: Auto retry 3 times, exponential backoff
 */
export const faceVerificationWorker = new Worker<FaceVerificationJobData>(
  QUEUE_NAME,
  processJob,
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

console.log('[FaceVerificationWorker] Face verification worker initialized');

/**
 * Event handlers cho worker lifecycle
 */
faceVerificationWorker.on('completed', (job) => {
  console.log(`[FaceVerificationWorker] Job ${job.id} completed successfully`);
});

faceVerificationWorker.on('failed', (job, err) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.log(`[FaceVerificationWorker] Job ${job?.id} failed: ${errorMsg}`);
});

faceVerificationWorker.on('error', (err) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(`[FaceVerificationWorker] Worker error: ${errorMsg}`);
});

/**
 * Graceful shutdown
 * Đợi tất cả jobs hoàn thành trước khi close
 */
process.on('SIGTERM', async () => {
  console.log('[FaceVerificationWorker] SIGTERM received, shutting down gracefully...');
  await faceVerificationWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});