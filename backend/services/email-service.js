const nodemailer = require('nodemailer');

/** HTML-escape a string to prevent XSS in email templates. */
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Email Service for Charitap
 * Handles all email notifications (charity invitations, admin alerts, etc.)
 */
class EmailService {
  constructor() {
    this.enabled = process.env.EMAIL_ENABLED === 'true';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@charitap.com';
    this.adminEmail = process.env.ADMIN_EMAIL || 'admin@charitap.com';
    
    // Create transporter based on environment
    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      console.log('[Email] Service initialized - ENABLED');
    } else {
      console.log('[Email] Service initialized - DISABLED (emails will be logged only)');
    }
  }

  /**
   * Send charity nomination notification to the charity
   */
  async sendCharityNomination(charityEmail, charityName, nominatedBy) {
    const subject = `You've been nominated to join Charitap! 🎉`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #F5F5F0; color: #1a1a1a; }
          .wrapper { background: #F5F5F0; padding: 40px 20px; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: #1a1a1a; padding: 36px 40px; text-align: center; }
          .header-logo { font-size: 28px; font-weight: 800; color: #FBBF24; letter-spacing: -0.5px; margin-bottom: 4px; }
          .header-tagline { color: #9CA3AF; font-size: 13px; }
          .badge { display: inline-block; background: #FBBF24; color: #1a1a1a; font-weight: 700; font-size: 13px; padding: 6px 18px; border-radius: 999px; margin-top: 20px; }
          .content { padding: 40px; }
          .greeting { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; }
          .body-text { font-size: 15px; color: #4B5563; line-height: 1.7; margin-bottom: 16px; }
          .highlight-box { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
          .highlight-box p { font-size: 15px; font-weight: 600; color: #92400E; margin-bottom: 8px; }
          .highlight-box span { font-size: 14px; color: #78350F; line-height: 1.6; }
          .section-title { font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 24px 0 12px; }
          .benefit-list { list-style: none; padding: 0; margin: 0 0 24px 0; }
          .benefit-list li { display: flex; align-items: flex-start; font-size: 14px; color: #4B5563; margin-bottom: 10px; line-height: 1.5; }
          .benefit-list li::before { content: ''; display: inline-block; width: 8px; height: 8px; background: #FBBF24; border-radius: 50%; margin-top: 6px; margin-right: 12px; flex-shrink: 0; }
          .steps-list { list-style: none; padding: 0; counter-reset: steps; margin: 0 0 24px 0; }
          .steps-list li { display: flex; align-items: flex-start; font-size: 14px; color: #4B5563; margin-bottom: 10px; line-height: 1.5; counter-increment: steps; }
          .steps-list li::before { content: counter(steps); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: #1a1a1a; color: #FBBF24; font-size: 11px; font-weight: 700; border-radius: 50%; margin-right: 12px; margin-top: 2px; flex-shrink: 0; }
          .divider { border: none; border-top: 1px solid #E5E7EB; margin: 28px 0; }
          .sign-off { font-size: 15px; color: #374151; margin-bottom: 4px; }
          .sign-off strong { color: #1a1a1a; }
          .footer { background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 24px 40px; text-align: center; }
          .footer p { font-size: 12px; color: #9CA3AF; line-height: 1.6; }
          .footer a { color: #FBBF24; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <img src="https://charitap-frontend.vercel.app/logo192.png" alt="Charitap" style="width:64px;height:64px;border-radius:50%;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
              <div class="header-logo">Charitap</div>
              <div class="header-tagline">Make a Difference One Click at a Time</div>
              <div class="badge">🎉 You've Been Nominated!</div>
            </div>
            <div class="content">
              <p class="greeting">Hi ${escHtml(charityName) || 'there'},</p>
              
              <p class="body-text">Great news! A Charitap user believes your organization would be perfect for our micro-donation platform.</p>
              
              <div class="highlight-box">
                <p>What is Charitap?</p>
                <span>Charitap enables people to donate spare change from everyday purchases. Users round up their transactions, and the accumulated amounts are donated to verified charities like yours.</span>
              </div>
              
              <p class="section-title">Why join Charitap?</p>
              <ul class="benefit-list">
                <li>Recurring micro-donations from engaged users</li>
                <li>Secure, PCI-compliant payment processing via Stripe</li>
                <li>Fast, automated fund transfers</li>
                <li>Transparent blockchain-verified donations</li>
                <li>Reach donation-minded individuals</li>
              </ul>
              
              <hr class="divider" />
              
              <p class="section-title">Next Steps</p>
              <p class="body-text">We'd love to learn more about your organization. Please reply to this email with:</p>
              <ol class="steps-list">
                <li>Your organization's full legal name</li>
                <li>EIN / Tax ID number (for 501(c)(3) verification)</li>
                <li>Contact person name and phone number</li>
                <li>Brief description of your mission (1-2 sentences)</li>
                <li>Official website URL</li>
              </ol>
              
              <p class="body-text">Once we verify your nonprofit status, we'll guide you through connecting your bank account via Stripe (it only takes 5 minutes!).</p>
              
              <p class="body-text"><strong>Questions?</strong> Simply reply to this email, and our team will be happy to help.</p>
              
              <p class="body-text">We're excited to potentially partner with you in making charitable giving effortless!</p>
              
              <hr class="divider" />
              <p class="sign-off">Best regards,<br/><strong>The Charitap Team</strong></p>
            </div>
            <div class="footer">
              <p>This invitation was initiated by a Charitap user (${escHtml(nominatedBy)})</p>
              <p>&copy; ${new Date().getFullYear()} Charitap. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
Hi ${charityName || 'there'},

Great news! A Charitap user believes your organization would be perfect for our micro-donation platform.

What is Charitap?
Charitap enables people to donate spare change from everyday purchases. Users round up their transactions, and accumulated amounts are donated to verified charities like yours.

Why join Charitap?
- Recurring micro-donations from engaged users
- Secure, PCI-compliant payment processing via Stripe
- Fast, automated fund transfers
- Transparent blockchain-verified donations
- Reach donation-minded individuals

Next Steps:
Please reply to this email with:
1. Your organization's full legal name
2. EIN / Tax ID number (for 501(c)(3) verification)
3. Contact person name and phone number
4. Brief description of your mission (1-2 sentences)
5. Official website URL

Once we verify your nonprofit status, we'll guide you through connecting your bank account via Stripe.

Questions? Simply reply to this email.

Best regards,
The Charitap Team

---
This invitation was initiated by a Charitap user (${nominatedBy})
    `;
    
    return this.sendEmail(charityEmail, subject, html, text);
  }

  /**
   * Send notification to admin about new charity nomination
   */
  async sendAdminNotification(applicationData) {
    const subject = `New Charity Nomination: ${applicationData.charityName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #F5F5F0; color: #1a1a1a; }
          .wrapper { background: #F5F5F0; padding: 40px 20px; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: #1a1a1a; padding: 28px 40px; display: flex; align-items: center; justify-content: space-between; }
          .header-logo { font-size: 22px; font-weight: 800; color: #FBBF24; }
          .header-badge { background: #FBBF24; color: #1a1a1a; font-size: 11px; font-weight: 700; padding: 4px 14px; border-radius: 999px; }
          .content { padding: 40px; }
          .title { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 20px; }
          .info-grid { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #FDE68A; font-size: 14px; }
          .info-row:last-child { border-bottom: none; padding-bottom: 0; }
          .info-label { color: #92400E; font-weight: 600; }
          .info-value { color: #1a1a1a; font-weight: 500; }
          .section-title { font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 24px 0 12px; }
          .steps-list { list-style: none; padding: 0; counter-reset: steps; margin: 0 0 24px 0; }
          .steps-list li { display: flex; align-items: flex-start; font-size: 14px; color: #4B5563; margin-bottom: 10px; line-height: 1.5; counter-increment: steps; }
          .steps-list li::before { content: counter(steps); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: #1a1a1a; color: #FBBF24; font-size: 11px; font-weight: 700; border-radius: 50%; margin-right: 12px; margin-top: 2px; flex-shrink: 0; }
          .note { font-size: 13px; color: #6B7280; font-style: italic; margin-bottom: 24px; }
          .footer { background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 24px 40px; text-align: center; }
          .footer p { font-size: 12px; color: #9CA3AF; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <img src="https://charitap-frontend.vercel.app/logo192.png" alt="Charitap" style="width:40px;height:40px;border-radius:50%;" />
                  <div class="header-logo">Charitap</div>
                </div>
                <div class="header-badge">Admin Alert</div>
              </div>
            </div>
            <div class="content">
              <p class="title">📋 New Charity Nomination</p>
              
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Charity Name:</span>
                  <span class="info-value">${escHtml(applicationData.charityName)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email Address:</span>
                  <span class="info-value">${escHtml(applicationData.charityEmail)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Category:</span>
                  <span class="info-value">${escHtml(applicationData.category)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Nominated By:</span>
                  <span class="info-value">${escHtml(applicationData.nominatedBy)}</span>
                </div>
                <div class="info-row" style="border-bottom: none;">
                  <span class="info-label">Request Date:</span>
                  <span class="info-value">${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              
              <p class="section-title">Action Items for Admin</p>
              <ol class="steps-list">
                <li>Wait for charity response with official docs</li>
                <li>Verify <strong>501(c)(3)</strong> status on IRS database</li>
                <li>Setup <strong>Stripe Express</strong> account for transfers</li>
                <li>Send final <strong>Stripe Onboarding</strong> link</li>
                <li>Approve organization in admin portal</li>
              </ol>
              
              <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin-top: 24px;">
                <p style="font-size: 13px; color: #4B5563; margin: 0;"><strong>Status:</strong> The charity has automatically received their nomination invitation email.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Charitap. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
New Charity Nomination

Charity Name: ${applicationData.charityName}
Email: ${applicationData.charityEmail}
Category: ${applicationData.category}
Nominated By: ${applicationData.nominatedBy}
Date: ${new Date().toLocaleString()}

Action Required:
1. Wait for charity to reply with their information
2. Verify 501(c)(3) status on IRS.gov
3. Create Stripe Express account
4. Send Stripe onboarding link
5. Approve in admin dashboard

The charity has been sent an email notification.
    `;
    
    return this.sendEmail(this.adminEmail, subject, html, text);
  }

  /**
   * Generic email sender
   */
  async sendEmail(to, subject, html, text) {
    const mailOptions = {
      from: `Charitap <${this.fromEmail}>`,
      to,
      subject,
      html,
      text
    };
    
    // Mask email to avoid PII in server logs: show first char + domain only
    const maskedTo = typeof to === 'string'
      ? to.replace(/^(.).*?(@.*)$/, '$1***$2')
      : '[email]';

    if (!this.enabled) {
      console.log(`[Email] DISABLED - Would send to ${maskedTo}: ${subject}`);
      return { success: true, message: 'Email service disabled - logged only' };
    }
    
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[Email] Sent to ${maskedTo}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[Email] Failed to send:', error.message);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    if (!this.enabled) {
      return { success: false, message: 'Email service is disabled' };
    }
    
    try {
      await this.transporter.verify();
      console.log('[Email] Connection test successful');
      return { success: true, message: 'Email service is working' };
    } catch (error) {
      console.error('[Email] Connection test failed:', error.message);
      return { success: false, message: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
