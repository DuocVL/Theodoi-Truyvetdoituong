

// A simple mock email service.
// In a real application, this would use a service like SendGrid, Mailgun, or Nodemailer.
class EmailService {
  public async sendActivationEmail(email: string, name: string, activationLink: string): Promise<void> {
    console.log('--------------------------------------------------');
    console.log(`[EmailService] Sending activation email to: ${email}`);
    console.log(`              Recipient: ${name}`);
    console.log('              Content: Please activate your account by clicking the link below.');
    console.log(`              Activation Link: ${activationLink}`);
    console.log('--------------------------------------------------');

    // Simulate network delay
    return new Promise(resolve => setTimeout(resolve, 500));
  }
}

export default EmailService;
