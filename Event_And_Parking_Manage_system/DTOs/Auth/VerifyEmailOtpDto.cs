namespace Event_And_Parking_Manage_system.DTOs.Auth
{
    public class VerifyEmailOtpDto
    {
        public string Email { get; set; } = string.Empty;

        public string Otp { get; set; } = string.Empty;
    }
}
