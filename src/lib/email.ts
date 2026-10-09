import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Shared HTML wrapper ──────────────────────────────────────────────────────
function htmlWrapper(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Literary Society UET</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:16px;border:1px solid #2a2a3a;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 40px;text-align:center;border-bottom:1px solid #2a2a3a;">
            <div style="display:inline-block;background:rgba(184,154,74,0.15);border:1px solid rgba(184,154,74,0.3);border-radius:12px;padding:10px 14px;margin-bottom:16px;">
              <span style="font-size:22px;">📖</span>
            </div>
            <h1 style="margin:0;font-size:20px;font-weight:700;color:#d4aa4a;letter-spacing:0.12em;text-transform:uppercase;">Literary Society</h1>
            <p style="margin:4px 0 0;font-size:12px;color:#6b7280;letter-spacing:0.18em;text-transform:uppercase;font-family:sans-serif;">UET Lahore</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #1e1e2e;text-align:center;">
            <p style="margin:0;font-size:11px;color:#4b5563;font-family:sans-serif;">Literary Society · University of Engineering & Technology, Lahore</p>
            <p style="margin:4px 0 0;font-size:11px;color:#374151;font-family:sans-serif;">This is an automated message. Please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── OTP Email ────────────────────────────────────────────────────────────────
export async function sendOTPEmail(to: string, otp: string, name?: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#f3f4f6;">Your Verification Code</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;font-family:sans-serif;line-height:1.6;">
      ${name ? `Hi ${name}, ` : ""}Use this one-time code to complete your action.
    </p>
    <div style="background:#0f0f1a;border:1px solid rgba(184,154,74,0.3);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-size:11px;color:#6b7280;letter-spacing:0.15em;text-transform:uppercase;font-family:sans-serif;">Verification Code</p>
      <p style="margin:0;font-size:42px;font-weight:700;letter-spacing:0.22em;color:#d4aa4a;font-family:monospace;">${otp}</p>
    </div>
    <p style="margin:0;font-size:12px;color:#6b7280;font-family:sans-serif;text-align:center;">This code expires in <strong style="color:#9ca3af;">10 minutes</strong>. Do not share it with anyone.</p>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Your Literary Society Verification Code",
    html: htmlWrapper(body),
  });
}

// ── Password Reset Email ─────────────────────────────────────────────────────
export async function sendPasswordResetEmail(to: string, resetLink: string, name?: string) {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#f3f4f6;">Reset Your Password</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;font-family:sans-serif;line-height:1.6;">
      ${name ? `Hi ${name}, ` : ""}We received a request to reset your password. Click the button below to set a new one.
    </p>
    <div style="text-align:center;margin:0 0 28px;">
      <a href="${resetLink}" style="display:inline-block;background:#d4aa4a;color:#0a0a0f;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;font-family:sans-serif;letter-spacing:0.04em;">
        Reset Password →
      </a>
    </div>
    <p style="margin:0 0 8px;font-size:12px;color:#6b7280;font-family:sans-serif;text-align:center;">
      This link expires in <strong style="color:#9ca3af;">1 hour</strong>.
    </p>
    <p style="margin:0;font-size:12px;color:#4b5563;font-family:sans-serif;text-align:center;">
      If you did not request this, you can safely ignore this email.
    </p>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Reset Your Literary Society Password",
    html: htmlWrapper(body),
  });
}

// ── Welcome / Credentials Email ──────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string, role: string, password: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;color:#f3f4f6;">Welcome to Literary Society!</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;font-family:sans-serif;line-height:1.6;">
      Hi <strong style="color:#f3f4f6;">${name}</strong>, your account has been created. You have been assigned the role of <strong style="color:#d4aa4a;">${role.replace("_", " ").toUpperCase()}</strong>.
    </p>
    <div style="background:#0f0f1a;border:1px solid #2a2a3a;border-radius:12px;padding:24px;margin:0 0 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#6b7280;font-family:sans-serif;">Email</td>
          <td style="padding:6px 0;font-size:13px;color:#f3f4f6;font-family:monospace;text-align:right;">${to}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#6b7280;font-family:sans-serif;">Password</td>
          <td style="padding:6px 0;font-size:13px;color:#d4aa4a;font-family:monospace;text-align:right;">${password}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#6b7280;font-family:sans-serif;">Role</td>
          <td style="padding:6px 0;font-size:13px;color:#f3f4f6;font-family:sans-serif;text-align:right;">${role.replace("_", " ")}</td>
        </tr>
      </table>
    </div>
    <div style="text-align:center;margin:0 0 16px;">
      <a href="${appUrl}/login" style="display:inline-block;background:#d4aa4a;color:#0a0a0f;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;font-family:sans-serif;">
        Login to Dashboard →
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#4b5563;font-family:sans-serif;text-align:center;">
      Please change your password after your first login from Settings.
    </p>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Your Literary Society Account is Ready",
    html: htmlWrapper(body),
  });
}

// ── Generic Notification Email ────────────────────────────────────────────────
export async function sendNotificationEmail(to: string, subject: string, message: string) {
  const body = `
    <h2 style="margin:0 0 16px;font-size:20px;color:#f3f4f6;">${subject}</h2>
    <p style="margin:0;font-size:14px;color:#9ca3af;font-family:sans-serif;line-height:1.7;">${message}</p>
  `;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html: htmlWrapper(body),
  });
}
