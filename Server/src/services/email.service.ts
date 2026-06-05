
import nodemailer from 'nodemailer';
import { env } from '../configs/env';

/**
 * @file Server/src/services/email.service.ts
 * @role Production-ready Email Service
 * @description
 * This service is responsible for sending all transactional emails from the application.
 * It uses Nodemailer and is configured via environment variables, allowing easy
 * switching between a development "trap" (like Mailtrap) and a production provider
 * (like SendGrid, Brevo, or Amazon SES).
 */
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create a single, reusable transporter object.
    // This is efficient as it uses a connection pool.
    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      // `secure: true` is only for port 465. All other ports use STARTTLS.
      secure: env.EMAIL_PORT === 465, 
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });

    // Verify the connection configuration on startup
    this.transporter.verify()
      .then(() => console.log('[EmailService] Ready to send emails via', env.EMAIL_HOST))
      .catch(err => console.error('[EmailService] Failed to connect. Check your .env config.', err));
  }

  /**
   * Sends an account activation email.
   * @param email The recipient's email address.
   * @param name The recipient's name.
   * @param activationLink The unique activation link.
   */
  public async sendActivationEmail(email: string, name: string, activationLink: string): Promise<void> {
    const mailOptions = {
      from: '"Giám Sát Đối Tượng" <no-reply@yourdomain.com>', // Sender address
      to: email, // List of receivers
      subject: 'Chào mừng! Vui lòng kích hoạt tài khoản của bạn', // Subject line
      text: `Xin chào ${name},\\n\\nVui lòng kích hoạt tài khoản của bạn bằng cách nhấp vào liên kết: ${activationLink}\\n\\nNếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.`, // Plain text body
      html: this.createHtmlTemplate(
        'Chào Mừng Bạn!',
        `Xin chào <strong>${name}</strong>,`,
        'Cảm ơn bạn đã đăng ký. Vui lòng nhấp vào nút bên dưới để kích hoạt tài khoản của bạn.',
        activationLink,
        'Kích hoạt tài khoản'
      ),
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`[EmailService] Activation email sent to: ${email}`);
  }

  /**
   * Sends a password reset email.
   * @param email The recipient's email address.
   * @param name The recipient's name.
   * @param resetLink The unique password reset link.
   */
  public async sendPasswordResetEmail(email: string, name: string, resetLink: string): Promise<void> {
    const mailOptions = {
        from: '"Giám Sát Đối Tượng" <no-reply@yourdomain.com>',
        to: email,
        subject: 'Yêu Cầu Đặt Lại Mật Khẩu Của Bạn',
        text: `Xin chào ${name},\\n\\nBạn đã yêu cầu đặt lại mật khẩu. Nhấp vào liên kết để tiếp tục: ${resetLink}\\n\\nLiên kết này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.`,
        html: this.createHtmlTemplate(
          'Đặt Lại Mật Khẩu',
          `Xin chào <strong>${name}</strong>,`,
          'Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn. Nhấp vào nút bên dưới để đặt mật khẩu mới. Liên kết này có hiệu lực trong một giờ.',
          resetLink,
          'Đặt Lại Mật Khẩu'
        ),
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`[EmailService] Password reset email sent to: ${email}`);
  }

  /**
   * A simple helper to generate a consistent HTML email body.
   * In a real app, use a templating engine like EJS or Handlebars
   */
  private createHtmlTemplate(title: string, greeting: string, body: string, link: string, buttonText: string): string {
    return \`
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #0056b3;">${title}</h2>
          <p>${greeting}</p>
          <p>${body}</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              ${buttonText}
            </a>
          </p>
          <p style="font-size: 0.9em;">Nếu nút không hoạt động, hãy sao chép và dán liên kết này vào trình duyệt của bạn:</p>
          <p style="font-size: 0.9em;"><a href="${link}" style="color: #007bff;">${link}</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
          <p style="font-size: 0.8em; color: #888;">Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email này một cách an toàn.</p>
        </div>
      </div>
    \`;
  }
}

// Export a singleton instance. This is the modern, efficient pattern.
// It ensures that the connection pool (transporter) is created only once.
export const emailService = new EmailService();
