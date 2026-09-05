using Event_And_Parking_Manage_system.DTOs.Customers;

namespace Event_And_Parking_Manage_system.Services.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginCustomerDto dto);
        Task<bool> ForgotPasswordAsync(string email);

        Task<bool> ResetPasswordAsync(string token, string newPassword);

        Task<bool> VerifyEmailAsync(string token);

        Task<bool> VerifyEmailOtpAsync(string email, string otp);

        Task<bool> ResendVerificationAsync(string email);

        
    }
}