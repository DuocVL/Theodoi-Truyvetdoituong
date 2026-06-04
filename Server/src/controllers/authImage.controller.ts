import { Request, Response, NextFunction } from 'express';
import { prisma } from '../configs/prisma';

// Upload a single authentication photo (expects multer `file`)
export const uploadAuthPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = (req as any).account?.id;
    if (!accountId) return res.status(401).json({ message: 'Unauthorized' });

    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: 'No photo provided' });

    const imageUrl = `/uploads/auth_images/${file.filename}`;
    const saved = await prisma.authImage.create({
      data: { account_id: accountId, image_url: imageUrl },
    });
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};

// List authentication photos – only admin/manager can view
export const listAuthPhotos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = (req as any).role;
    if (!['admin', 'manager'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const photos = await prisma.authImage.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(photos);
  } catch (err) {
    next(err);
  }
};
