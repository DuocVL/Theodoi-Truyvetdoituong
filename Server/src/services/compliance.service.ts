import { ZoneType } from '../../generated/prisma/enums';
import { prisma } from '../configs/prisma';
import * as alertRepository from '../repositories/alert.repository';
import { NotificationService } from '../services/notification.service';
import { logger } from '../utils/log-helper';

//dịch vụ kiểm tra tuân thủ và leo thang cảnh báo
//tiến trình chạy ngầm cronjob chạy định kỳ

export class ComplianceService {

  private notificationService = new NotificationService();//dịch vụ gửi thông báo

  //lấy danh sách các subject cần kiểm tra
  public async checkCheckinCompliance(): Promise<void> {

    //lấy các subject cần xử lý trong thời gian cần checkins , trong thời gian quản lý
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    const subjects = await prisma.subject.findMany({
      where: {
        status: 'ACTIVE',
        deleted_at: null,
        active_start_time: { lte: currentTime },
        active_end_time: { gte: currentTime },
      },
      include: { currentZone: true },
    });

    //vòng lặp xử lý từng đối tượng
    for (const subject of subjects) {
      try {
        await this.processSubject(subject, now);
      } catch (err) {
        logger.error(`[ComplianceCron] Lỗi xử lý subject ${subject.id}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  //hàm xử lý cảnh báo đối tượng
  private async processSubject(subject: any, now: Date): Promise<void> {

    const interval = (subject.currentZone?.type === ZoneType.SAFE && subject.currentZone?.interval_minutes) ?? subject.interval_minutes;//lấy chu kỳ checkin ưu tiên theo zone
    const grace = (subject.currentZone?.type === ZoneType.SAFE && subject.currentZone?.grace_minutes) ?? subject.grace_minutes;//thời gian nhân nhượng

    //xác định mốc thời gian ưu tiên lần checkin cuối -> mốc bắt đầu giám sát -> thời điểm tạo
    const baseline = subject.last_checkin_at ?? subject.monitoring_start ?? subject.created_at;

    const dueAt = new Date(baseline.getTime() + interval * 60_000);//thời gian đến hạn phải checkin
    const graceDeadline = new Date(dueAt.getTime() + grace * 60_000);//thời điểm hết hạn chờ (hạn chót trễ không bị phạt)

    if (now < dueAt) return; // chưa tới hạn

    if (now < graceDeadline) {//tới hạn chưa tạo cảnh báo

      // Giai đoạn nhắc nhở nhẹ — chỉ nhắc 1 lần trong giai đoạn này 
      //kiểm tra đã gửi thông báo nahwcs nhwor chưa subject.last_reminder_at subject.last_notified_at >= dueAt 
      const reminded = subject.last_reminder_at && subject.last_reminder_at >= dueAt;
      if (!reminded) {//nếu chưa gửi trong chu kỳ hạn checkin hiện tại
        await this.notificationService.notifySubject(//gửi thông báo nhắc nhở
          subject.id,
          `Vui lòng checkin${subject.currentZone ? ` tại ${subject.currentZone.zone_name}` : ''}`
        );
        //cập nhật thười gian gửi thông báo nhắc nhở
        await prisma.subject.update({ where: { id: subject.id }, data: { last_reminder_at: now } });
        logger.info(`[ComplianceCron] Gửi thông báo nhắc nhở đến ${subject.id}`);
      }
      return;
    }

    // Đã hết thời gian chờ — bắt đầu chu kỳ leo thang: mỗi chu kỳ checkin phút trôi qua mà vẫn im lặng, nhắc + tạo Alert mới 1 lần
    const alerted = subject.last_alert_at && subject.last_alert_at >= graceDeadline;//kiểm tra gửi nhắc nhở chưa
    const minutesLate = Math.floor((now.getTime() - dueAt.getTime()) / 60_000);//thời gian trễ

    //chưa từng gửi cảnh báo trong chu kỳ checkin này
    if (!alerted) {
      await this.notificationService.notifySubject( //gửi cảnh báo
        subject.id,
        `CẢNH BÁO: Bạn đã quá hạn checkin từ lúc ${dueAt.toLocaleString('vi-VN')}, vui lòng checkin ngay`
      );
      //tạo cảnh báo gửi cho cán bộ
      await alertRepository.createAlert({
        subject_id: subject.id,
        zone_id: subject.current_zone_id,
        type: 'MISSED_CHECKIN',
        message: `Đối tượng ${subject.full_name} đã bỏ lỡ checkin, trễ ${minutesLate} phút so với hạn quy định${subject.currentZone ? ` tại khu vực "${subject.currentZone.zone_name}"` : ''}.`,
      });
      //cập nhật thời gian lần cuối gửi thông báo
      await prisma.subject.update({ where: { id: subject.id }, data: { last_alert_at: now } });
      logger.info(`[ComplianceCron] First alert for subject ${subject.id}`);

      return;
    }

    //gửi cảnh báo lặp lại với những lần miss checkin sau
    const nextAlertTime = new Date(subject.last_alert_at.getTime() + interval * 60_000);//thời gian sẽ gửi alert nếu ko checkin

    if (now >= nextAlertTime) {//tạo và gửi lại cảnh báo

      await this.notificationService.notifySubject(
        subject.id,
        `CẢNH BÁO: Bạn đã quá hạn checkin từ lúc ${dueAt.toLocaleString("vi-VN")}, vui lòng checkin ngay`
      );

      await alertRepository.createAlert({
        subject_id: subject.id,
        zone_id: subject.current_zone_id,
        type: 'MISSED_CHECKIN',
        message:
          `Đối tượng ${subject.full_name} đã bỏ lỡ checkin, trễ ${minutesLate} phút ${subject.currentZone ? ` tại khu vực "${subject.currentZone.zone_name}"` : ''}.`
      });

      await prisma.subject.update({ where: { id: subject.id },data: { last_alert_at: now }});
      logger.info(`[ComplianceCron] Repeated alert for subject ${subject.id}`);
    }
  }
}