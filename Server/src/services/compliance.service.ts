import { prisma } from '../configs/prisma';
import { AlertRepository } from '../repositories/alert.repository';
import { NotificationService } from '../services/notification.service';
import { logger } from '../utils/log-helper';

export class ComplianceService {
  private alertRepository = new AlertRepository();
  private notificationService = new NotificationService();

  public async checkCheckinCompliance(): Promise<void> {
    const now = new Date();

    const subjects = await prisma.subject.findMany({
      where: {
        status: 'ACTIVE',
        deleted_at: null,
      },
      include: { currentZone: true },
    });

    for (const subject of subjects) {
      try {
        await this.processSubject(subject, now);
      } catch (err) {
        logger.error(`[ComplianceCron] Lỗi xử lý subject ${subject.id}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  private async processSubject(subject: any, now: Date): Promise<void> {
    const interval = subject.currentZone?.interval_minutes ?? subject.interval_minutes;
    const grace = subject.currentZone?.grace_minutes ?? subject.grace_minutes;

    const baseline = subject.last_checkin_at ?? subject.monitoring_start ?? subject.created_at;
    const dueAt = new Date(baseline.getTime() + interval * 60_000);
    const graceDeadline = new Date(dueAt.getTime() + grace * 60_000);

    if (now < dueAt) return; // chưa tới hạn, bỏ qua

    if (now < graceDeadline) {
      const alreadyNotified = subject.last_notified_at && subject.last_notified_at >= dueAt;
      if (!alreadyNotified) {
        await this.notificationService.notifySubject(
          subject.id,
          `Vui lòng checkin${subject.currentZone ? ` tại ${subject.currentZone.zone_name}` : ''}`
        );
        await prisma.subject.update({ where: { id: subject.id }, data: { last_notified_at: now } });
      }
      return;
    }

    // Hết grace mà vẫn chưa checkin -> tạo Alert (tránh tạo trùng)
    const existingAlert = await this.alertRepository.findRecentMissedAlert(subject.id, dueAt);
    if (!existingAlert) {
      await this.alertRepository.create({
        subject_id: subject.id,
        zone_id: subject.current_zone_id,
        type: 'MISSED_CHECKIN',
      });
      logger.info(`[ComplianceCron] Tạo Alert MISSED_CHECKIN cho subject ${subject.id}`);
    }
  }
}