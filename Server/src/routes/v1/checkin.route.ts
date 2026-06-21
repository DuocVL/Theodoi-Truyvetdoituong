/**
 * @file checkin.route.ts
 * @description Định nghĩa các API endpoints cho module Checkin.
 */

import { Router } from 'express';
import { CheckinController } from '../../controllers/checkin.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCheckinSchema, updateCheckinSchema } from '../../dtos/checkin.dto';
import upload from '../../middlewares/upload.middleware';

const router = Router();
const checkinController = new CheckinController();


// Protect all checkin routes
router.use(authMiddleware);


// Get current user's checkins
router.get(
  '/me',
  checkinController.getMyCheckins
);


// Create checkin
// form-data:
// image: file
router.post(
  '/',
  upload.single('image'),
  validate(createCheckinSchema),
  checkinController.createCheckin
);


// Get checkin by ID
router.get(
  '/:id',
  checkinController.getCheckinById
);


// Get checkins by subject
router.get(
  '/subject/:subjectId',
  checkinController.getCheckinsBySubject
);


// Update checkin
router.patch(
  '/:id',
  validate(updateCheckinSchema),
  checkinController.updateCheckin
);


export default router;