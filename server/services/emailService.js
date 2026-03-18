const nodemailer = require('nodemailer');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

function createTransport() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null; // email sending disabled
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendEmail({ to, subject, html }) {
  const transporter = createTransport();
  if (!transporter) {
    console.warn('[Email] GMAIL_USER/GMAIL_APP_PASSWORD not set — email not sent');
    return false;
  }
  await transporter.sendMail({
    from: `"Florida HOA Shield" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
  return true;
}

function paymentRequestEmail({ memberName, description, amount, category, dueDate, paymentUrl }) {
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const due = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Upon receipt';
  return {
    subject: `HOA Payment Request: ${description}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#1a3a5c;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;">Florida HOA Shield</h1>
          <p style="margin:4px 0 0;color:#a8c4e0;font-size:14px;">Community Management Portal</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;color:#1a3a5c;font-size:20px;">Payment Request</h2>
          <p style="color:#555;margin:0 0 24px;">Hello ${memberName},</p>
          <p style="color:#555;margin:0 0 24px;">You have a new payment request from your HOA. Please review the details below and click the button to complete your payment securely via Stripe.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:6px;padding:20px;margin-bottom:24px;">
            <tr><td style="padding:6px 0;color:#888;font-size:13px;">Description</td><td style="padding:6px 0;color:#333;font-weight:bold;text-align:right;">${description}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:13px;">Category</td><td style="padding:6px 0;color:#333;text-align:right;text-transform:capitalize;">${category}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:13px;">Due Date</td><td style="padding:6px 0;color:#333;text-align:right;">${due}</td></tr>
            <tr><td colspan="2" style="border-top:1px solid #ddd;padding:12px 0 0;"></td></tr>
            <tr><td style="padding:4px 0;color:#1a3a5c;font-weight:bold;font-size:16px;">Amount Due</td><td style="padding:4px 0;color:#c0392b;font-weight:bold;font-size:20px;text-align:right;">${formatted}</td></tr>
          </table>

          <p style="text-align:center;margin:0 0 32px;">
            <a href="${paymentUrl}" style="display:inline-block;background:#1a3a5c;color:#fff;text-decoration:none;padding:14px 40px;border-radius:6px;font-size:16px;font-weight:bold;">Pay Now — ${formatted}</a>
          </p>

          <p style="color:#888;font-size:13px;margin:0 0 8px;">This payment link is secure and powered by Stripe. Your card information is never stored on HOA servers.</p>
          <p style="color:#aaa;font-size:12px;margin:0;">If you have questions about this charge, please contact your HOA board. This link expires in 30 days.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8f9fa;padding:16px 32px;border-top:1px solid #eee;">
          <p style="margin:0;color:#aaa;font-size:12px;text-align:center;">Florida HOA Shield &bull; Community Management Portal &bull; <a href="${CLIENT_URL}" style="color:#1a3a5c;text-decoration:none;">Login to Portal</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function paymentReceiptEmail({ memberName, description, amount, category, paidDate, receiptNumber }) {
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const paid = new Date(paidDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return {
    subject: `Payment Receipt: ${description} — ${formatted}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#27ae60;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;">Florida HOA Shield</h1>
          <p style="margin:4px 0 0;color:#a8f0c0;font-size:14px;">Payment Confirmation</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:#d4edda;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;">✓</div>
            <h2 style="margin:12px 0 4px;color:#155724;font-size:24px;">Payment Received!</h2>
            <p style="color:#555;margin:0;">Thank you, ${memberName}.</p>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:6px;padding:20px;margin-bottom:24px;">
            <tr><td style="padding:6px 0;color:#888;font-size:13px;">Receipt #</td><td style="padding:6px 0;color:#333;text-align:right;font-family:monospace;">${receiptNumber}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:13px;">Description</td><td style="padding:6px 0;color:#333;font-weight:bold;text-align:right;">${description}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:13px;">Category</td><td style="padding:6px 0;color:#333;text-align:right;text-transform:capitalize;">${category}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:13px;">Date Paid</td><td style="padding:6px 0;color:#333;text-align:right;">${paid}</td></tr>
            <tr><td colspan="2" style="border-top:1px solid #ddd;padding:12px 0 0;"></td></tr>
            <tr><td style="padding:4px 0;color:#155724;font-weight:bold;font-size:16px;">Amount Paid</td><td style="padding:4px 0;color:#27ae60;font-weight:bold;font-size:20px;text-align:right;">${formatted}</td></tr>
          </table>

          <p style="color:#888;font-size:13px;margin:0 0 8px;">Please keep this email as your payment receipt. You can also view your payment history in the HOA portal.</p>
          <p style="text-align:center;margin:24px 0 0;">
            <a href="${CLIENT_URL}/payments" style="display:inline-block;background:#1a3a5c;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;">View Payment History</a>
          </p>
        </td></tr>
        <tr><td style="background:#f8f9fa;padding:16px 32px;border-top:1px solid #eee;">
          <p style="margin:0;color:#aaa;font-size:12px;text-align:center;">Florida HOA Shield &bull; Community Management Portal</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

function welcomeEmail({ memberName, email, tempPassword, role }) {
  return {
    subject: 'Welcome to Florida HOA Shield — Your Account is Ready',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#1a3a5c;padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;">Florida HOA Shield</h1>
          <p style="margin:4px 0 0;color:#a8c4e0;font-size:14px;">Community Management Portal</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#1a3a5c;">Welcome, ${memberName}!</h2>
          <p style="color:#555;margin:0 0 24px;">Your HOA community portal account has been created. Use the credentials below to log in.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:6px;padding:20px;margin-bottom:24px;">
            <tr><td style="padding:6px 0;color:#888;font-size:13px;">Portal URL</td><td style="padding:6px 0;text-align:right;"><a href="${CLIENT_URL}" style="color:#1a3a5c;">${CLIENT_URL}</a></td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:13px;">Email</td><td style="padding:6px 0;color:#333;text-align:right;">${email}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:13px;">Temporary Password</td><td style="padding:6px 0;color:#333;font-family:monospace;font-weight:bold;text-align:right;">${tempPassword}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:13px;">Role</td><td style="padding:6px 0;color:#333;text-align:right;text-transform:capitalize;">${role.replace('_', ' ')}</td></tr>
          </table>

          <p style="text-align:center;margin:0 0 24px;">
            <a href="${CLIENT_URL}/login" style="display:inline-block;background:#1a3a5c;color:#fff;text-decoration:none;padding:14px 40px;border-radius:6px;font-size:16px;font-weight:bold;">Log In to Portal</a>
          </p>

          <p style="color:#c0392b;font-size:13px;font-weight:bold;margin:0 0 4px;">Please change your password after first login.</p>
          <p style="color:#aaa;font-size:12px;margin:0;">If you did not expect this email, please contact your HOA board.</p>
        </td></tr>
        <tr><td style="background:#f8f9fa;padding:16px 32px;border-top:1px solid #eee;">
          <p style="margin:0;color:#aaa;font-size:12px;text-align:center;">Florida HOA Shield &bull; Community Management Portal</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

module.exports = { sendEmail, paymentRequestEmail, paymentReceiptEmail, welcomeEmail };
