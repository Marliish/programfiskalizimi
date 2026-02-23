// Email Service - Mock/Console Logger
// In production, integrate with SendGrid, AWS SES, or similar

import crypto from 'crypto';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private testMode = process.env.NODE_ENV !== 'production';

  /**
   * Send email (mock in development, real in production)
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (this.testMode) {
      console.log('📧 [EMAIL MOCK]', {
        to: options.to,
        subject: options.subject,
        preview: options.text?.slice(0, 100) || options.html.slice(0, 100),
      });
      return true;
    }

    // TODO: Integrate with real email service (SendGrid, SES, etc.)
    throw new Error('Production email service not configured');
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string, firstName?: string): Promise<boolean> {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #4F46E5; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { font-size: 12px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Verify Your Email</h1>
          <p>Hi ${firstName || 'there'},</p>
          <p>Thanks for signing up for FiscalNext! Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}" class="button">Verify Email Address</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <div class="footer">
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>© ${new Date().getFullYear()} FiscalNext. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${firstName || 'there'},

Thanks for signing up for FiscalNext! Please verify your email address by visiting:

${verifyUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

© ${new Date().getFullYear()} FiscalNext
    `.trim();

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - FiscalNext',
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, firstName?: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #DC2626; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer { font-size: 12px; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Reset Your Password</h1>
          <p>Hi ${firstName || 'there'},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <div class="footer">
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            <p>© ${new Date().getFullYear()} FiscalNext. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hi ${firstName || 'there'},

We received a request to reset your password. Visit this link to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} FiscalNext
    `.trim();

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - FiscalNext',
      html,
      text,
    });
  }

  /**
   * Generate secure token
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

export const emailService = new EmailService();
