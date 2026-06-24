import { Router } from "express";
import { LocationController } from "../../controllers/location.controller";

const router = Router();
const controller = new LocationController();

/**
 * Android gửi GPS mỗi 30s
 */
router.post("/", controller.create);

/**
 * Lấy lịch sử di chuyển
 */
router.get("/history/:subject_id", controller.history);

export default router;