import { messaging } from '../configs/firebase'; // Đường dẫn đến file firebase.ts đã khởi tạo
import { logger } from '../utils/log-helper';

async function sendTestNotification() {
  // Thay thế bằng FCM Token thực tế từ máy Android của bạn
  const targetToken = 'dUkSr74iTSyAjgQVWdDyhh:APA91bH7tNGcXFK1U5DyStfqZ10vI9psIMjsnrvzgr-UIISIsjs2AHk7rj3mfdidYx9EJj1BDMtEYpT4wzOo6visTdH44ecRHgpEDxsfsACS2cAWHY9ziJc'; 

  const message = {
    notification: {
    title: 'Nhắc nhở checkin',
    body: 'Bạn đã quá hạn checkin, vui lòng kiểm tra ngay!'
  },
  data: {
    click_action: 'FLUTTER_NOTIFICATION_CLICK', // hoặc tên activity nếu dùng native
    subject_id: '123'
  },
    token: targetToken
  };

  try {
    const response = await messaging.send(message);
    logger.info(`[TEST-FCM] Gửi thành công: ${response}`);
  } catch (error) {
    logger.error(`[TEST-FCM] Lỗi gửi FCM: ${error}`);
  }
}

sendTestNotification();