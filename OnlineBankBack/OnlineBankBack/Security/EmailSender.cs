using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace OnlineBankBack.Security
{
    public class EmailSender
    {
        private readonly string _senderEmail;
        private readonly string _senderPassword;

        public EmailSender(IConfiguration configuration)
        {
            _senderEmail = configuration["Email:Address"]!;
            _senderPassword = configuration["Email:Password"]!;
        }

        public async Task SendPinCodeEmailAsync(string recipientEmail, string fullName, string pinCode, string lastFour)
        {
            string maskedCard = $"************{lastFour}";

            string htmlBody = $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""UTF-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
  <title>Your NeoBank PIN Code</title>
</head>
<body style=""margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',sans-serif;"">
  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#f4f6f8;padding:48px 16px;"">
    <tr>
      <td align=""center"">
        <table width=""460"" cellpadding=""0"" cellspacing=""0"" style=""background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;"">
          <tr>
            <td style=""height:4px;background:#1a1a2e;""></td>
          </tr>
          <tr>
            <td style=""padding:32px 40px 8px;"">
              <h1 style=""margin:0;font-size:22px;color:#1a1a2e;letter-spacing:1px;"">NeoBank</h1>
            </td>
          </tr>
          <tr>
            <td style=""padding:16px 40px 8px;"">
              <p style=""margin:0;font-size:15px;color:#444;line-height:1.6;"">Hi {fullName},</p>
              <p style=""margin:12px 0 0;font-size:15px;color:#444;line-height:1.6;"">
                Your PIN code for card <strong style=""color:#1a1a2e;letter-spacing:1px;"">{maskedCard}</strong> is:
              </p>
            </td>
          </tr>
          <tr>
            <td style=""padding:24px 40px;"">
              <div style=""display:inline-block;background:#f4f6f8;border:1px solid #e0e0e0;border-radius:8px;padding:18px 40px;"">
                <span style=""font-size:32px;font-weight:700;letter-spacing:8px;color:#1a1a2e;"">{pinCode}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style=""padding:8px 40px 32px;"">
              <p style=""margin:0;font-size:13px;color:#888;line-height:1.6;"">
                If you did not request this PIN, please contact support immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style=""padding:16px 40px;border-top:1px solid #f0f0f0;"">
              <p style=""margin:0;font-size:12px;color:#bbb;"">NeoBank &mdash; keep your PIN private and never share it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("NeoBank", _senderEmail));
            message.To.Add(new MailboxAddress(fullName, recipientEmail));
            message.Subject = $"Your NeoBank PIN for card {maskedCard}";
            message.Body = new TextPart("html") { Text = htmlBody };

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_senderEmail, _senderPassword);
            await smtp.SendAsync(message);
            await smtp.DisconnectAsync(true);
        }
    }
}