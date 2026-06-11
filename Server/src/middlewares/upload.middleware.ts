
import multer from 'multer';
import { Request } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { HttpException } from '../exceptions/http-exception';

// Define the allowed upload types
type UploadType = 'avatars' | 'checkins' | 'subjects';

// Define base path for uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure base upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Ensure subdirectories exist
const subdirectories: UploadType[] = ['avatars', 'checkins', 'subjects'];
subdirectories.forEach(subdir => {
  const dirPath = path.join(UPLOAD_DIR, subdir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Multer file filter to allow only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new HttpException(400, 'Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'));
  }
};

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // The upload type is passed in the request body or query params
    const uploadType = (req.body.uploadType || req.query.uploadType) as UploadType;
    
    if (!uploadType || !subdirectories.includes(uploadType)) {
      return cb(new HttpException(400, 'Invalid or missing uploadType.'), '');
    }

    const destPath = path.join(UPLOAD_DIR, uploadType);
    cb(null, destPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const randomName = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, `${randomName}${extension}`);
  },
});

// Create the Multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit as a safeguard
  },
});

export default upload;
