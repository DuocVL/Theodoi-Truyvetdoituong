import { Router } from "express";
import { LocationController } from "../../controllers/location.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from '../../middlewares/validate.middleware';
import { createLocationHistory } from "../../dtos/location.dto";

//xử lý các yêu cầu liên quan đến lịch xử vị trí

const router = Router();
const controller = new LocationController();

router.use(authMiddleware)

//Android nền gửi vị trí GPS định kỳ
router.post("/", validate(createLocationHistory), controller.create);

//lấy lịch sử vị trí
router.get("/history/:subject_id", controller.history);

export default router;