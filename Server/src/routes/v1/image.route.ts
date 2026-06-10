
import { Router } from 'express';
import { ImageController } from '../../controllers/image.controller';
import upload from '../../middlewares/upload.middleware';
import { authMiddleware } from '../..//middlewares/auth.middleware'; // Assuming you want to protect these routes

const router = Router();
const imageController = new ImageController();

// Protect all image routes
router.use(authMiddleware);

// Route to upload a single image. 
// The field name in the form-data must be 'image'.
// The body must contain 'uploadType' ('avatars', 'checkins', or 'subjects')
router.post('/', upload.single('image'), imageController.uploadImage);

// Route to get image details by ID
router.get('/:id', imageController.getImageById);

// Route to delete an image by ID
router.delete('/:id', imageController.deleteImageById);

export default router;
