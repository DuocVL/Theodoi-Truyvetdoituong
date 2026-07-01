import app from './app';
import { env } from './configs/env';
import { logger } from './utils/log-helper';
import { startCheckinComplianceCron } from './queues/checkin-compliance.cron';

const PORT = env.PORT;

//Chạy server
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    startCheckinComplianceCron();//Chạy cronjob kiểm tra checkin
});