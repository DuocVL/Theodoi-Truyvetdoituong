import { messaging } from '../configs/firebase';
import { logger } from '../utils/log-helper';
import { prisma } from '../configs/prisma'

export class NotificationService {
  public async notifySubject(subjectId: string, message: string): Promise<void> {
    try {
      // 1. Lấy FCM Token từ Database của Subject
      const subject = await prisma.subject.findUnique({ 
        where: { id: subjectId },
        select: { fcm_token: true } // Yêu cầu bạn đã thêm field này vào model Subject
      });

      if (!subject?.fcm_token) {
        logger.info(`[NOTIFY] Subject ${subjectId} chưa có FCM Token`);
        return;
      }

      // 2. Gửi thông báo
      await messaging.send({
        token: subject.fcm_token,
        notification: {
          title: 'Nhắc nhở từ hệ thống',
          body: message,
        },
        data: {
          type: 'CHECKIN_REMINDER',
          subjectId: subjectId
        }
      });
      
      logger.info(`[NOTIFY] Gửi thành công tới subject=${subjectId}`);
    } catch (error) {
      logger.error(`[NOTIFY] Lỗi gửi FCM: ${error}`);
    }
  }
}