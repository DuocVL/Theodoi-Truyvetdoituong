/**
 * @file Server/src/scripts/test-email.ts
 * @role Kịch bản kiểm tra gửi email thực tế
 * @description
 * File này gửi một email thật đến một địa chỉ email được chỉ định. 
 * Nó được dùng để kiểm tra cấu hình với một nhà cung cấp email thực tế như Gmail, SendGrid,...
 * 
 * --- CÁCH CHẠY ---
 * 1. Cập nhật file .env với thông tin SMTP của nhà cung cấp (ví dụ: Gmail).
 * 2. THAY ĐỔI BIẾN `recipientEmail` bên dưới thành email thật của bạn.
 * 3. Mở terminal tại thư mục `Server` và chạy lệnh: `ts-node --esm ./src/scripts/test-email.ts`
 */

import { emailService } from '../services/email.service';
import { env } from '../configs/env';

async function testRealEmailSending() {
  console.log('--- Bắt đầu kịch bản gửi email THỰC TẾ ---');

  // --- !!! QUAN TRỌNG: THAY ĐỔI EMAIL NGƯỜI NHẬN TẠI ĐÂY !!! ---
  const recipientEmail = 'thanhvancong2023@gmail.com'; // <--- THAY BẰNG EMAIL THẬT CỦA BẠN ĐỂ NHẬN MAIL
  // -----------------------------------------------------------------

  // Kiểm tra an toàn để đảm bảo bạn đã thay đổi email
  if (recipientEmail.includes('YOUR_REAL_EMAIL_HERE')) {
    console.error('\nLỖI: Bạn chưa thay đổi email người nhận trong file `test-email.ts`.');
    console.error('Vui lòng mở file và sửa lại biến `recipientEmail` thành email thật của bạn.');
    process.exit(1);
  }

  try {
    const recipientName = 'Người Dùng Test';
    const fakeToken = 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8';
    const activationLink = `${env.FRONTEND_URL}/auth/activate?token=${fakeToken}`;

    console.log(`\nĐang chuẩn bị gửi email đến: ${recipientEmail}`);
    console.log(`Thông qua email server: ${env.EMAIL_HOST}:${env.EMAIL_PORT}`);
    console.log(`Với người dùng: ${env.EMAIL_USER}`);

    await emailService.sendActivationEmail(
      recipientEmail, 
      recipientName, 
      activationLink
    );

    console.log(
      '\n--- THÀNH CÔNG! ---' +
      `\nLệnh gửi email đã được thực thi. Hãy kiểm tra hộp thư đến của ${recipientEmail}.` +
      '\n(Lưu ý: email có thể nằm trong mục "Spam" hoặc "Quảng cáo")'
    );

  } catch (error) {
    console.error('\n--- THẤT BẠI! Đã có lỗi xảy ra --- ');
    console.error('Lỗi này có thể do:');
    console.error('  1. Sai thông tin EMAIL_* trong file .env (đặc biệt là Mật khẩu ứng dụng). ');
    console.error('  2. Google chặn đăng nhập do nghi ngờ (hiếm khi xảy ra với Mật khẩu ứng dụng).');
    console.error('\nChi tiết lỗi:', error);
    process.exit(1); 
  }
}

testRealEmailSending().finally(() => {
  console.log('\n--- Kịch bản đã kết thúc ---');
});


//npx tsx src\test\test-email.ts
