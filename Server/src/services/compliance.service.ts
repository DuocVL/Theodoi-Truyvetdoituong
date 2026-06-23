import { prisma } from '../configs/prisma';
import * as alertRepository from '../repositories/alert.repository';
import { NotificationService } from '../services/notification.service';
import { logger } from '../utils/log-helper';

export class ComplianceService {
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

    if (now < dueAt) return; // chưa tới hạn

    if (now < graceDeadline) {
      // Giai đoạn nhắc nhở nhẹ — chỉ nhắc 1 lần trong giai đoạn này
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

    // Đã hết grace — bắt đầu chu kỳ leo thang: mỗi `interval` phút trôi qua mà vẫn im lặng, nhắc + tạo Alert mới 1 lần
    const lastEscalation = subject.last_notified_at ?? graceDeadline;
    const nextEscalationDue = new Date(lastEscalation.getTime() + interval * 60_000);

    if (now >= nextEscalationDue) {
      const minutesLate = Math.floor((now.getTime() - dueAt.getTime()) / 60_000);
      await this.notificationService.notifySubject(
        subject.id,
        `CẢNH BÁO: Bạn đã quá hạn checkin từ lúc ${dueAt.toLocaleString('vi-VN')}, vui lòng checkin ngay`
      );
      await alertRepository.createAlert({
        subject_id: subject.id,
        zone_id: subject.current_zone_id,
        type: 'MISSED_CHECKIN',
        message: `Đối tượng ${subject.full_name} đã bỏ lỡ checkin, trễ ${minutesLate} phút so với hạn quy định${subject.currentZone ? ` tại khu vực "${subject.currentZone.zone_name}"` : ''}.`,
      });
      await prisma.subject.update({ where: { id: subject.id }, data: { last_notified_at: now } });
      logger.info(`[ComplianceCron] Tạo Alert MISSED_CHECKIN (lặp lại) cho subject ${subject.id}`);
    }
  }
}