import { logger } from '../utils/log-helper';
// import admin from 'firebase-admin'; // bật khi đã cấu hình firebase-admin ở configs/

export class NotificationService {
  public async notifySubject(subjectId: string, message: string): Promise<void> {
    // TODO: thay bằng gửi FCM thật khi Subject có field fcm_token
    // const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    // if (subject?.fcm_token) {
    //   await admin.messaging().send({ token: subject.fcm_token, notification: { title: 'Nhắc nhở', body: message } });
    //   return;
    // }
    logger.info(`[NOTIFY-STUB] subject=${subjectId} message="${message}"`);
  }
}