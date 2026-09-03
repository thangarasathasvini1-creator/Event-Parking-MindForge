namespace Event_And_Parking_Manage_system.DTOs.Customers
{
    public class ResetPasswordDto
    {
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}