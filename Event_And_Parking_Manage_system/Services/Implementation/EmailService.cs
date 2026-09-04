using Event_And_Parking_Manage_system.Services.Interfaces;
using System.Net;
using System.Net.Mail;

namespace Event_And_Parking_Manage_system.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendVerificationEmailAsync(
            string email,
            string name,
            string token)
        {
            var verificationLink =
                $"https://localhost:7291/api/Auth/verify-email?token={token}";

            var subject = "Verify Your Email - Event & Parking Reservation System";

            var body = $@"
                <h2>Hello {name},</h2>
                <p>Thank you for registering with Event & Parking Reservation System.</p>
                <p>Please click the button below to verify your email:</p>

                <p>
                    <a href='{verificationLink}'>
                        Verify Email
                    </a>
                </p>

                <p>This verification link will expire in 24 hours.</p>
                <p>If you did not create this account, please ignore this email.</p>
            ";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendPasswordResetEmailAsync(
            string email,
            string name,
            string token)
        {
            var resetLink =
                $"https://localhost:4200/reset-password?token={token}";

            var subject = "Reset Your Password - Event & Parking Reservation System";

            var body = $@"
                <h2>Hello {name},</h2>

                <p>We received a request to reset your password.</p>

                <p>
                    <a href='{resetLink}'>
                        Reset Password
                    </a>
                </p>

                <p>This reset link will expire in 1 hour.</p>

                <p>If you did not request a password reset, please ignore this email.</p>
            ";

            await SendEmailAsync(email, subject, body);
        }

        private async Task SendEmailAsync(
            string recipientEmail,
            string subject,
            string body)
        {
            var smtpServer =
                _configuration["EmailSettings:SmtpServer"];

            var port =
                _configuration.GetValue<int>("EmailSettings:Port");

            var senderName =
                _configuration["EmailSettings:SenderName"];

            var senderEmail =
                _configuration["EmailSettings:SenderEmail"];

            var username =
                _configuration["EmailSettings:Username"];

            var password =
                _configuration["EmailSettings:Password"];

            var enableSsl =
                _configuration.GetValue<bool>("EmailSettings:EnableSsl");

            using var message = new MailMessage();

            message.From = new MailAddress(senderEmail!, senderName);
            message.To.Add(recipientEmail);
            message.Subject = subject;
            message.Body = body;
            message.IsBodyHtml = true;

            using var smtp = new SmtpClient(smtpServer, port);

            smtp.Credentials = new NetworkCredential(username, password);
            smtp.EnableSsl = enableSsl;

            await smtp.SendMailAsync(message);
        }
    }
}