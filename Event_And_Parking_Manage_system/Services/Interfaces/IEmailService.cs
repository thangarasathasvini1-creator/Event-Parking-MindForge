namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendVerificationEmailAsync(
            string email,
            string name,
            string token);

        Task SendPasswordResetEmailAsync(
            string email,
            string name,
            string token);
    }
}