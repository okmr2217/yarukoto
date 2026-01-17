import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM || "noreply@example.com";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject: "パスワードのリセット - Yarukoto",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 32px;
                border: 1px solid #e5e7eb;
              }
              .header {
                text-align: center;
                margin-bottom: 32px;
              }
              .header h1 {
                color: #f97316;
                font-size: 24px;
                margin: 0;
              }
              .content {
                margin-bottom: 32px;
              }
              .button {
                display: inline-block;
                background-color: #f97316;
                color: #ffffff;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 500;
                margin: 16px 0;
              }
              .footer {
                text-align: center;
                font-size: 12px;
                color: #6b7280;
                margin-top: 32px;
                padding-top: 16px;
                border-top: 1px solid #e5e7eb;
              }
              .warning {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 12px;
                margin: 16px 0;
                border-radius: 4px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Yarukoto</h1>
              </div>
              <div class="content">
                <p>パスワードのリセットをリクエストされました。</p>
                <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">パスワードをリセット</a>
                </div>
                <p style="font-size: 14px; color: #6b7280;">
                  または、以下のURLをブラウザにコピー&ペーストしてください:<br>
                  <a href="${resetUrl}" style="color: #f97316; word-break: break-all;">${resetUrl}</a>
                </p>
                <div class="warning">
                  <strong>注意:</strong> このリンクは1時間で期限切れになります。パスワードリセットをリクエストしていない場合は、このメールを無視してください。
                </div>
              </div>
              <div class="footer">
                <p>このメールは Yarukoto から自動送信されています。</p>
                <p>心当たりがない場合は、このメールを削除してください。</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw error;
  }
}
