/**
 * Resend Email Service for Vibel / SparkSite
 * Sends beautiful transactional emails when websites complete building.
 */

interface SendWebsiteReadyOptions {
  to: string;
  projectName: string;
  previewUrl: string;
  summary?: string;
}

export async function sendWebsiteReadyEmail({
  to,
  projectName,
  previewUrl,
  summary,
}: SendWebsiteReadyOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.log("[Email] RESEND_API_KEY not configured, skipping email notification.");
    return false;
  }

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 40px 20px; }
    .container { max-width: 560px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .badge { display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
    h1 { font-size: 24px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; }
    p { font-size: 15px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px 0; }
    .summary-box { background-color: #09090b; border: 1px solid #27272a; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #d4d4d8; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 10px; text-align: center; }
    .footer { font-size: 12px; color: #71717a; text-align: center; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">Build Complete</div>
    <h1>Your website "${projectName}" is live! 🚀</h1>
    <p>Our autonomous multi-agent engine finished designing, coding, and verifying your Next.js application.</p>
    
    ${summary ? `<div class="summary-box"><strong>What was built:</strong><br>${summary}</div>` : ""}

    <div style="text-align: center; margin: 32px 0;">
      <a href="${previewUrl}" class="btn" target="_blank">View Live Preview →</a>
    </div>

    <p style="font-size: 13px; color: #71717a; margin-bottom: 0;">
      Direct Sandbox URL: <a href="${previewUrl}" style="color: #818cf8; text-decoration: none;">${previewUrl}</a>
    </p>
  </div>
  <div class="footer">
    Sent by SparkSite AI Engine • Powered by Next.js 15 & Resend
  </div>
</body>
</html>
`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SparkSite <onboarding@resend.dev>",
        to: [to],
        subject: `🚀 Your website "${projectName}" is ready!`,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.warn(`[Email] Resend API error (${res.status}):`, errBody);
      return false;
    }

    console.log(`[Email] ✅ Notification email sent via Resend to: ${to}`);
    return true;
  } catch (err) {
    console.warn("[Email] Failed to send email:", err);
    return false;
  }
}
