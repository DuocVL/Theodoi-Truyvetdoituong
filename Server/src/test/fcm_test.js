const admin = require('firebase-admin');
const serviceAccount = require('../../truy-vet-doi-tuong-firebase-adminsdk-fbsvc-51944fca63.json');

// Khởi tạo Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Thay bằng Token bạn lấy được từ Logcat của Android ở Bước 2
const registrationToken = 'TOKEN_ANDROID_CỦA_BẠN_Ở_ĐÂY';

const message = {
  notification: {
    title: 'Xin chào từ Node.js',
    body: 'Đây là tin nhắn test FCM gửi qua Admin SDK!'
  },
  token: registrationToken
};

// Gửi tin nhắn
admin.messaging().send(message)
  .then((response) => {
    console.log('Gửi thành công:', response);
  })
  .catch((error) => {
    console.error('Lỗi gửi tin nhắn:', error);
  });