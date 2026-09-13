using Event_And_Parking_Manage_system.Services.Interfaces;
using Event_And_Parking_Manage_system.Helpers;
using System.Net;
using System.Net.Mail;
namespace Event_And_Parking_Manage_system.Services;
public class EmailService(IConfiguration configuration, ILogger<EmailService> logger) : IEmailService
{
    private string Link(string page, string token) => $"{(configuration["Frontend:BaseUrl"] ?? "http://localhost:4200").TrimEnd('/')}/{page}?token={Uri.EscapeDataString(token)}";
    private string Content(string name, string text, string? otp, string? token, string page) =>
        $"<h2>Hello {WebUtility.HtmlEncode(name)}</h2><p>{text}</p>" +
        (otp == null ? "" : $"<p>Your code is <strong>{WebUtility.HtmlEncode(otp)}</strong>. You have five attempts.</p>") +
        (token == null ? "" : $"<p><a href='{WebUtility.HtmlEncode(Link(page, token))}'>Continue securely</a></p>") +
        $"<p>This code/link expires in {AccountSecurity.Minutes(configuration, "Token")} minutes. Ignore this email if you did not request it.</p>";
    public Task SendVerificationEmailAsync(string email, string name, string token) => SendAsync(email, "Verify your email", Content(name,"Verify your email address.",null,token,"verify-email"));
    public Task SendVerificationOtpEmailAsync(string email, string name, string otp, string? token = null) => SendAsync(email,"Verify your email",Content(name,"Use the code or link to verify your email.",otp,token,"verify-email"));
    public Task SendPasswordResetEmailAsync(string email, string name, string token) => SendAsync(email,"Reset your password",Content(name,"Reset your password.",null,token,"reset-password"));
    public Task SendPasswordResetOtpEmailAsync(string email, string name, string otp, string? token = null) => SendAsync(email,"Reset your password",Content(name,"Use the code or link to reset your password.",otp,token,"reset-password"));
    private async Task SendAsync(string recipient, string subject, string body)
    {
        using var message = new MailMessage { From = new MailAddress(configuration["EmailSettings:SenderEmail"] ?? "noreply@example.test", configuration["EmailSettings:SenderName"] ?? "Eventra"), Subject = subject, Body = body, IsBodyHtml = true };
        message.To.Add(recipient);
        using var smtp = new SmtpClient(configuration["EmailSettings:SmtpServer"], configuration.GetValue<int?>("EmailSettings:Port") ?? 587);
        if (configuration["EmailSettings:DeliveryMethod"] == "Pickup")
        {
            var folder = Path.GetFullPath(configuration["EmailSettings:PickupDirectory"] ?? throw new InvalidOperationException("Email pickup directory is required."));
            Directory.CreateDirectory(folder); smtp.DeliveryMethod = SmtpDeliveryMethod.SpecifiedPickupDirectory; smtp.PickupDirectoryLocation = folder;
        }
        else { smtp.EnableSsl = configuration.GetValue<bool>("EmailSettings:EnableSsl"); smtp.Credentials = new NetworkCredential(configuration["EmailSettings:Username"], configuration["EmailSettings:Password"]); }
        try { await smtp.SendMailAsync(message); }
        catch (Exception ex) { logger.LogError(ex,"Unable to send account email. User can request a new code."); }
    }
}
