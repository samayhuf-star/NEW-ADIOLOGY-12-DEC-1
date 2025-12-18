import { ServerClient } from 'postmark';

const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_API_TOKEN || '');

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody?: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
  tag?: string;
  metadata?: Record<string, string>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const {
    to,
    subject,
    htmlBody,
    textBody,
    from = 'noreply@adiology.com',
    replyTo,
    tag,
    metadata
  } = options;

  if (!process.env.POSTMARK_SERVER_API_TOKEN) {
    console.error('POSTMARK_SERVER_API_TOKEN not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await postmarkClient.sendEmail({
      From: from,
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody || (htmlBody ? undefined : 'No content'),
      ReplyTo: replyTo,
      Tag: tag,
      Metadata: metadata
    });

    return {
      success: true,
      messageId: result.MessageID
    };
  } catch (error: any) {
    console.error('Postmark email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

export async function sendTemplateEmail(options: {
  to: string;
  templateAlias: string;
  templateModel: Record<string, any>;
  from?: string;
  tag?: string;
}): Promise<EmailResult> {
  const { to, templateAlias, templateModel, from = 'noreply@adiology.com', tag } = options;

  if (!process.env.POSTMARK_SERVER_API_TOKEN) {
    console.error('POSTMARK_SERVER_API_TOKEN not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await postmarkClient.sendEmailWithTemplate({
      From: from,
      To: to,
      TemplateAlias: templateAlias,
      TemplateModel: templateModel,
      Tag: tag
    });

    return {
      success: true,
      messageId: result.MessageID
    };
  } catch (error: any) {
    console.error('Postmark template email error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send template email'
    };
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'Welcome to Adiology!',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Welcome to Adiology!</h1>
        <p>Hi ${name || 'there'},</p>
        <p>Thank you for joining Adiology! We're excited to help you create powerful Google Ads campaigns.</p>
        <p>With Adiology, you can:</p>
        <ul>
          <li>Generate keywords automatically</li>
          <li>Create compelling ad copy</li>
          <li>Export campaigns in Google Ads Editor format</li>
          <li>Build and manage website templates</li>
        </ul>
        <p>Get started by creating your first campaign!</p>
        <p>Best regards,<br>The Adiology Team</p>
      </div>
    `,
    tag: 'welcome'
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'Reset Your Adiology Password',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Password Reset Request</h1>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The Adiology Team</p>
      </div>
    `,
    tag: 'password-reset'
  });
}

export async function sendTeamInviteEmail(to: string, inviterName: string, teamName: string, inviteLink: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `You've been invited to join ${teamName} on Adiology`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Team Invitation</h1>
        <p>${inviterName} has invited you to join <strong>${teamName}</strong> on Adiology.</p>
        <p>Click the button below to accept the invitation:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a>
        </p>
        <p>If you don't have an Adiology account yet, you'll be able to create one.</p>
        <p>Best regards,<br>The Adiology Team</p>
      </div>
    `,
    tag: 'team-invite'
  });
}

export async function sendCampaignExportEmail(to: string, campaignName: string, downloadLink: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: `Your campaign "${campaignName}" is ready`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Campaign Export Ready</h1>
        <p>Your campaign <strong>"${campaignName}"</strong> has been exported and is ready for download.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${downloadLink}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Download Campaign</a>
        </p>
        <p>This download link will expire in 24 hours.</p>
        <p>Best regards,<br>The Adiology Team</p>
      </div>
    `,
    tag: 'campaign-export'
  });
}
