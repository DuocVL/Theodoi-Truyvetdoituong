import cron from 'node-cron';
import { ComplianceService } from '../services/compliance.service';
import { logger } from '../utils/log-helper';

const complianceService = new ComplianceService();

export function startCheckinComplianceCron(): void {
  // Chạy mỗi 1 phút — đủ chính xác cho interval_minutes/grace_minutes tính theo phút
  cron.schedule('*/1 * * * *', async () => {
    try {
      await complianceService.checkCheckinCompliance();
    } catch (err) {
      logger.error(`[ComplianceCron] Lỗi chạy cron: ${err instanceof Error ? err.message : err}`);
    }
  });

  logger.info('[ComplianceCron] Đã khởi động cron kiểm tra checkin định kỳ (mỗi 1 phút)');
}