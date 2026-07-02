import nodemailer from 'nodemailer';
import { env } from '../configs/env';

// 1. Khởi tạo và kiểm tra kết nối Transporter
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT),
  secure: false,
  auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
});

transporter.verify()
  .then(() => console.log(`[EmailService] Connected to ${env.EMAIL_HOST}`))
  .catch((err) => console.error('[EmailService] Failed to connect:', err));

// 2. Template HTML rút gọn (Sử dụng implicit return)
const createHtmlTemplate = (title: string, greeting: string, body: string, link: string, btnText: string): string => `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:20px auto; padding:20px; border:1px solid #ddd; border-radius:10px;">
    <h2 style="color:#0056b3;">${title}</h2>
    <p>${greeting}</p>
    <p>${body}</p>
    <p style="text-align:center; margin:30px 0;">
      <a href="${link}" style="background:#007bff; color:white; text-decoration:none; padding:12px 24px; border-radius:5px; display:inline-block; font-weight:bold;">${btnText}</a>
    </p>
    <p>Nếu nút không hoạt động, hãy sử dụng liên kết sau:</p>
    <p><a href="${link}">${link}</a></p>
    <hr>
    <p style="font-size:12px; color:#888;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
  </div>
`;

// 3. Hàm gửi mail core (Gom các logic lặp lại về đây)
interface SendMailOptions {
  to: string;
  subject: string;
  title: string;
  greeting: string;
  body: string;
  link: string;
  btnText: string;
}

const sendMail = async ({ to, subject, title, greeting, body, link, btnText }: SendMailOptions) => {
  await transporter.sendMail({
    from: '"Giám Sát Đối Tượng" <noreply@theodoitruyvetdoituong.com>',
    to,
    subject,
    text: `${greeting.replace(/<[^>]*>/g, '')}\n\n${body}\n\nLiên kết: ${link}`, // Tự động loại bỏ thẻ HTML cho bản text
    html: createHtmlTemplate(title, greeting, body, link, btnText),
  });
  console.log(`[EmailService] ${subject} email sent to ${to}`);
};

// 4. Các service exports chính
export const sendActivationEmail = (to: string, token: string): Promise<void> => {
  const link = `${env.FRONTEND_URL}/activate-account?token=${token}`;
  return sendMail({
    to,
    link,
    subject: 'Kích hoạt tài khoản',
    title: 'Kích hoạt tài khoản',
    greeting: 'Xin chào,',
    body: 'Cảm ơn bạn đã đăng ký. Vui lòng nhấn nút bên dưới để kích hoạt tài khoản.',
    btnText: 'Kích hoạt tài khoản',
  });
};

export const sendPasswordResetEmail = (to: string, token: string): Promise<void> => {
  const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  return sendMail({
    to,
    link,
    subject: 'Đặt lại mật khẩu',
    title: 'Đặt lại mật khẩu',
    greeting: `Xin chào ,`,
    body: 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn. Liên kết này sẽ hết hạn sau 1 giờ.',
    btnText: 'Đặt lại mật khẩu',
  });
};