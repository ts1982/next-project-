import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL || "noreply@example.com";

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: "パスワードリセットのご案内", Charset: "UTF-8" },
      Body: {
        Text: {
          Data: [
            "パスワードリセットのリクエストを受け付けました。",
            "",
            "以下のリンクから新しいパスワードを設定してください。",
            "このリンクは1時間後に無効になります。",
            "",
            resetUrl,
            "",
            "このメールに心当たりがない場合は、無視してください。",
          ].join("\n"),
          Charset: "UTF-8",
        },
        Html: {
          Data: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">パスワードリセット</h2>
  <p>パスワードリセットのリクエストを受け付けました。</p>
  <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
  <p style="margin: 24px 0;">
    <a href="${resetUrl}"
       style="background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      パスワードを再設定する
    </a>
  </p>
  <p style="font-size: 14px; color: #666;">このリンクは1時間後に無効になります。</p>
  <p style="font-size: 14px; color: #666;">このメールに心当たりがない場合は、無視してください。</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="font-size: 12px; color: #999;">このメールは自動送信されています。返信はできません。</p>
</body>
</html>`.trim(),
          Charset: "UTF-8",
        },
      },
    },
  });

  await ses.send(command);
}
