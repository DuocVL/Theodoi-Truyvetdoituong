import app from './app';
import { env } from './configs/env';
import { logger } from './utils/logger';
import { startCheckinComplianceCron } from './queues/checkin-compliance.cron';

const PORT = env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    startCheckinComplianceCron();
});