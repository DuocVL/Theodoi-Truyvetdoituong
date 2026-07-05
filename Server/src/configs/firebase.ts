import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
//nạp tệp cấu hình chứa khóa bí mật (Private key) được tải từ Google Firebase Console
import serviceAccount from "../../truy-vet-doi-tuong-firebase-adminsdk-fbsvc-51944fca63.json";

// tệp cấu hình Firebase Admin SDK 

// Khởi tạo Firebase ADMIN SDK
const app = initializeApp({
  credential: cert(serviceAccount as ServiceAccount)//cert() đọc các thông tin định danh tạo phiên kết nối với Firebase Cloud
});

// Khởi tạo dịch vụ FCM
const messaging = getMessaging(app);

export { messaging };