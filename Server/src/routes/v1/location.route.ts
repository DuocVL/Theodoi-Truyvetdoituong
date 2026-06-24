import { Router } from "express";
import { LocationController } from "../../controllers/location.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();
const controller = new LocationController();

router.use(authMiddleware)

/**
 * Android gửi GPS mỗi 30s
 */
router.post("/", controller.create);

/**
 * Lấy lịch sử di chuyển
 */
router.get("/history/:subject_id", controller.history);

export default router;