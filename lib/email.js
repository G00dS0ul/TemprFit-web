import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_for_build');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://temprfit.com';
const LOGO_URL = `${APP_URL}/images/brand/my-logo.png`;
const THEME_COLOR = '#22c55e'; // Green

const getEmailTemplate = (title, content, ctaLabel, ctaUrl) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 12px; padding: 40px; border: 1px solid #262626; }
      .header { text-align: center; margin-bottom: 30px; }
      .logo { max-width: 150px; }
      h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; font-weight: 700; }
      p { font-size: 16px; line-height: 1.5; color: #a3a3a3; margin-bottom: 20px; }
      .btn { display: inline-block; background-color: ${THEME_COLOR}; color: #000000; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 20px; }
      .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #525252; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="${LOGO_URL}" alt="TemprFit" class="logo" />
      </div>
      <h1>${title}</h1>
      ${content}
      ${ctaLabel && ctaUrl ? `<a href="${ctaUrl}" class="btn">${ctaLabel}</a>` : ''}
      <div class="footer">
        <p>You're receiving this email because you are a member of TemprFit.</p>
        <p>&copy; ${new Date().getFullYear()} TemprFit. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

export async function sendLoginAlert(email, username, ipAddress) {
  if (!process.env.RESEND_API_KEY) return;
  
  const content = `
    <p>Hi ${username},</p>
    <p>We noticed a new login to your TemprFit account.</p>
    <ul style="color: #a3a3a3; padding-left: 20px;">
      <li><strong>Date & Time:</strong> ${new Date().toLocaleString()}</li>
      <li><strong>IP Address:</strong> ${ipAddress || 'Unknown'}</li>
    </ul>
    <p>If this was you, you can safely ignore this email. If you don't recognize this activity, please contact support immediately to secure your account.</p>
  `;
  
  await resend.emails.send({
    from: 'TemprFit Security <security@resend.dev>',
    to: email,
    subject: 'New Login to your TemprFit Account',
    html: getEmailTemplate('New Login Alert', content, 'Go to Dashboard', `${APP_URL}/dashboard`)
  });
}

export async function sendInactivityReminder(email, username) {
  if (!process.env.RESEND_API_KEY) return;

  const content = `
    <p>Hey ${username},</p>
    <p>It's been a few days since we last saw you at the Forge! Your AI coach is waiting, and consistency is the key to unlocking your goals.</p>
    <p>Log in today to complete your check-in, smash a workout, and keep your streak alive.</p>
  `;
  
  await resend.emails.send({
    from: 'TemprFit Coach <coach@resend.dev>',
    to: email,
    subject: 'Your coach is waiting for you! 💪',
    html: getEmailTemplate('Time to crush it!', content, 'Resume Training', `${APP_URL}/dashboard`)
  });
}

export async function sendEngagementAlert(email, username, action, actorName, link) {
  if (!process.env.RESEND_API_KEY) return;

  const content = `
    <p>Hi ${username},</p>
    <p><strong>${actorName}</strong> just ${action}!</p>
    <p>Jump back into the community to see what they said and keep the conversation going.</p>
  `;
  
  await resend.emails.send({
    from: 'TemprFit Community <community@resend.dev>',
    to: email,
    subject: `${actorName} ${action}`,
    html: getEmailTemplate('New Activity', content, 'View Activity', `${APP_URL}${link}`)
  });
}

export async function sendVerificationEmail(email, code) {
  if (!process.env.RESEND_API_KEY) return;

  const content = `
    <p>Welcome to TemprFit!</p>
    <p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 4px;">${code}</strong></p>
    <p>This code expires in 10 minutes.</p>
  `;
  
  try {
    await resend.emails.send({
      from: 'TemprFit <onboarding@resend.dev>',
      to: email,
      subject: 'Your TemprFit Verification Code',
      html: getEmailTemplate('Verify your email', content, null, null)
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
}
