/**
 * @file Server/src/scripts/test-email.ts
 * @role Kịch bản kiểm tra dịch vụ gửi email
 * @description
 * File này chứa một kịch bản độc lập để kiểm tra việc gửi email thông qua EmailService.
 * Nó sẽ gửi một email kích hoạt tài khoản mẫu. Nếu thành công, email sẽ xuất hiện
 * trong hộp thư Mailtrap của bạn (nếu đang ở môi trường development).
 * 
 * --- CÁCH CHẠY ---
 * 1. Đảm bảo bạn đã điền đúng thông tin EMAIL_* trong tệp .env.
 * 2. Mở terminal và trỏ đến thư mục `Server` của bạn.
 * 3. Chạy lệnh: `ts-node --esm ./src/scripts/test-email.ts`
 */

import { emailService } from '../services/email.service';
import { env } from '../configs/env';

async function testEmailSending() {
  console.log('--- Bắt đầu kịch bản kiểm tra gửi email ---');

  try {
    // --- Dữ liệu mẫu ---
    const recipientEmail = 'test@example.com'; // Đây là email người nhận "giả"
    const recipientName = 'John Doe';
    const fakeToken = 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8';
    const activationLink = `${env.FRONTEND_URL}/auth/activate?token=${fakeToken}`;

    console.log(`\nĐang chuẩn bị gửi email đến: ${recipientEmail}`);
    console.log(`Thông qua email server: ${env.EMAIL_HOST}:${env.EMAIL_PORT}`);
    console.log(`Link kích hoạt mẫu: ${activationLink}`);

    // --- Gọi hàm gửi email --- 
    await emailService.sendActivationEmail(
      recipientEmail, 
      recipientName, 
      activationLink
    );

    console.log(
      '\n--- THÀNH CÔNG! ---' +
      '\nLệnh gửi email đã được thực thi mà không có lỗi.' +
      '\nHãy kiểm tra hộp thư của bạn tại https://mailtrap.io/inboxes'
    );

  } catch (error) {
    console.error('\n--- THẤT BẠI! Đã có lỗi xảy ra --- ');
    console.error('Lỗi này có thể do một trong các nguyên nhân sau:');
    console.error('  1. Các biến môi trường EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS trong file .env bị sai.');
    console.error('  2. Máy của bạn bị tường lửa chặn cổng (port) kết nối đến email server.');
    console.error('  3. Dịch vụ email (ví dụ: Mailtrap) đang gặp sự cố.');
    console.error('\nChi tiết lỗi:', error);
    process.exit(1); // Thoát với mã lỗi
  }
}

// Chạy hàm test
testEmailSending().finally(() => {
  // Nodemailer quản lý kết nối dưới nền, không cần ngắt kết nối thủ công ở đây.
  console.log('\n--- Kịch bản đã kết thúc ---');
});
