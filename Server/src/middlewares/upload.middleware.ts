import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Destination folder (ensure it exists)
const uploadDir = path.resolve(__dirname, '../../uploads/auth_images');

export const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// Accept a single file named 'photo'. No size limit (user can adjust later).
export const upload = multer({ storage });
