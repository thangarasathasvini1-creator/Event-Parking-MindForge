using Event_And_Parking_Manage_system.Services.Interfaces;

namespace Event_And_Parking_Manage_system.Services
{
    public class AuthService : IAuthService
    {
        private static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public async Task<bool> ForgotPasswordAsync(string email)
        {
            return true;
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            return true;
        }

        public async Task<bool> VerifyEmailAsync(string token)
        {
            return true;
        }

        public async Task<bool> ResendVerificationAsync(string email)
        {
            return true;
        }
    }
}