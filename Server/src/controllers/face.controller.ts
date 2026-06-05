
import { NextFunction, Response } from 'express';
import multer from 'multer';
import faceService from '../services/face.service';
import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../configs/prisma';
import { RequestWithUser } from '../types/data';
import { faceVerificationQueue } from '../queues/face-verification.queue';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { files: 5, fileSize: 10 * 1024 * 1024 } });

class FaceController {
  public uploadMiddleware = upload.array('files', 5);

  public register = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length < 3) {
        res.status(400).json({ message: 'At least 3 images are required.' });
        return;
      }

      const accountId = req.account?.id;
      if (!accountId) {
        res.status(401).json({ message: 'Unauthorized: Account ID not found.' });
        return;
      }

      const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });

      if (!subject) {
        res.status(403).json({ message: 'Forbidden: User is not a subject.' });
        return;
      }

      const embedding = await faceService.registerFace(files);
      
      await prisma.$executeRaw`
        INSERT INTO "face_data" (id, subject_id, embedding, image_url, status, created_at, update_at)
        VALUES (gen_random_uuid(), ${subject.id}, ${JSON.stringify(embedding)}::vector, 'initial_registration', 'ACTIVE', NOW(), NOW())
      `;

      res.status(201).json({ message: 'Face registered successfully.' });
    } catch (error) {
      next(error);
    }
  };

  public checkIn = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      const { latitude, longitude } = req.body;

      if (!files || files.length === 0 || !latitude || !longitude) {
        res.status(400).json({ message: 'Images and location are required.' });
        return;
      }

      const accountId = req.account?.id;
      if (!accountId) {
        res.status(401).json({ message: 'Unauthorized: Account ID not found.' });
        return;
      }

      const subject = await prisma.subject.findUnique({ where: { account_id: accountId } });
      if (!subject) {
        res.status(403).json({ message: 'Forbidden: User is not a subject.' });
        return;
      }

      const lat = Number(latitude);
      const lng = Number(longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        res.status(400).json({ message: 'Invalid location coordinates.' });
        return;
      }

      const geoJsonString = JSON.stringify({ type: 'Point', coordinates: [lng, lat] });
      const rawQuery = Prisma.sql`ST_GeomFromGeoJSON(${geoJsonString})`;

      const checkinRecords = await prisma.$queryRaw<any[]>`
        INSERT INTO "checkins" (subject_id, location, status, face_verified, confidence, checkin_time)
        VALUES (${subject.id}, ${rawQuery}, 'PROCESSING', false, 0, NOW())
        RETURNING id;
      `;
      const checkinRecord = checkinRecords[0];

      const jobData = {
        checkinId: checkinRecord.id.toString(),
        subjectId: subject.id,
        files: files.map(f => ({ 
            buffer: f.buffer.toString('base64'),
            originalname: f.originalname,
            mimetype: f.mimetype
        }))
      };

      await faceVerificationQueue.add('verify-face', jobData);

      res.status(202).json({ 
        message: 'Check-in accepted and is being processed.',
        checkinId: checkinRecord.id.toString()
      });

    } catch (error) {
      next(error);
    }
  };
}

export default FaceController;
