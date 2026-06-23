import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import serviceAccount from "../../truy-vet-doi-tuong-firebase-adminsdk-fbsvc-51944fca63.json";

// Khởi tạo app
const app = initializeApp({
  credential: cert(serviceAccount as ServiceAccount)
});

// Khởi tạo messaging
const messaging = getMessaging(app);

export { messaging };