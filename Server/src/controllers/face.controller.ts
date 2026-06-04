
import { NextFunction, Response } from 'express';
import multer from 'multer';
import FaceService from '../services/face.service';
import { PrismaClient } from '../../generated/prisma';
import { RequestWithUser } from '../types/data';
import { faceVerificationQueue } from '../queues/face-verification.queue';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { files: 5, fileSize: 10 * 1024 * 1024 } });

class FaceController {
  public faceService = new FaceService();
  public prisma = new PrismaClient();
  public uploadMiddleware = upload.array('files', 5);

  public register = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length < 3) {
        res.status(400).json({ message: 'At least 3 images are required.' });
        return;
      }

      const accountId = req.user.id;
      const subject = await this.prisma.subject.findUnique({ where: { account_id: accountId } });

      if (!subject) {
        res.status(403).json({ message: 'Forbidden: User is not a subject.' });
        return;
      }

      const embedding = await this.faceService.registerFace(files);
      
      await this.prisma.$executeRaw`
        INSERT INTO "face_data" (id, subject_id, embedding, image_url, status, created_at, update_at)
        VALUES (gen_random_uuid(), ${subject.id}, ${JSON.stringify(embedding)}::vector, 'initial_registration', 'ACTIVE', NOW(), NOW())
        ON CONFLICT (subject_id) DO UPDATE 
        SET embedding = ${JSON.stringify(embedding)}::vector, update_at = NOW();
      `;

      res.status(201).json({ message: 'Face registered successfully.' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/v1/face/check-in:
   *   post:
   *     summary: Accepts a check-in request and queues it for processing.
   *     description: Uploads images and location, then immediately responds while processing happens in the background.
   *     tags: [Face]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       202:
   *         description: Check-in request accepted and is being processed.
   *       400:
   *         description: Bad request (e.g., missing images or location).
   */
  public checkIn = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      const { latitude, longitude } = req.body;

      if (!files || files.length === 0 || !latitude || !longitude) {
        res.status(400).json({ message: 'Images and location are required.' });
        return;
      }

      const accountId = req.user.id;
      const subject = await this.prisma.subject.findUnique({ where: { account_id: accountId } });
      if (!subject) {
        res.status(403).json({ message: 'Forbidden: User is not a subject.' });
        return;
      }

      // 1. Create a placeholder check-in record
      const checkinRecord = await this.prisma.checkin.create({
        data: {
          subject_id: subject.id,
          location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] }, // Assuming GeoJSON point
          status: 'PROCESSING', // New status
          face_verified: false,
          confidence: 0,
        }
      });

      // 2. Add job to the queue
      const jobData = {
        checkinId: checkinRecord.id,
        subjectId: subject.id,
        files: files.map(f => ({ 
            buffer: f.buffer.toString('base64'), // Pass buffer as base64 string
            originalname: f.originalname,
            mimetype: f.mimetype
        }))
      };

      await faceVerificationQueue.add('verify-face', jobData);

      // 3. Respond immediately
      res.status(202).json({ 
        message: 'Check-in accepted and is being processed.',
        checkinId: checkinRecord.id
      });

    } catch (error) {
      next(error);
    }
  };
}

export default FaceController;
