using Event_And_Parking_Manage_system.DTOs.Customers;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Event_And_Parking_Manage_system.Services
{
    public class AuthService : IAuthService
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthService(ICustomerRepository customerRepository, 
            IConfiguration configuration,
            IEmailService emailService)
        {
            _customerRepository = customerRepository;
            _configuration = configuration;
            _emailService = emailService;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginCustomerDto dto)
        {
            var customer = await _customerRepository.GetByEmailAsync(dto.Email);

            if (customer == null)
                return null;

            if (customer.Status != Models.Enums.CustomerStatus.Active)
                return null;

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, customer.PasswordHash))
                return null;

            if (!customer.EmailVerified)
                return null;

            return new LoginResponseDto
            {
                CustomerId = customer.CustomerId,
                Name = customer.Name,
                Email = customer.Email,
                Role = customer.Role.ToString(),
                Token = GenerateJwtToken(customer)
            };
        }

        private string GenerateJwtToken(Customer customer)
        {
            var jwtKey = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key is not configured.");

            var jwtIssuer = _configuration["Jwt:Issuer"];
            var jwtAudience = _configuration["Jwt:Audience"];

            var expiryMinutes = _configuration.GetValue<int>("Jwt:ExpiryMinutes");

            var claims = new List<Claim>
                {
                    new Claim(
                        ClaimTypes.NameIdentifier,
                        customer.CustomerId.ToString()),

                    new Claim(
                        ClaimTypes.Name,
                        customer.Name),

                    new Claim(
                        ClaimTypes.Email,
                        customer.Email),

                    new Claim(
                        ClaimTypes.Role,
                        customer.Role.ToString())
                };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey));

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        

        public async Task<bool> ForgotPasswordAsync(string email)
        {
            var customer = await _customerRepository.GetByEmailAsync(email);

            if (customer == null)
                return true;

            var resetToken = Guid.NewGuid().ToString("N");

            customer.PasswordResetTokenHash =
                BCrypt.Net.BCrypt.HashPassword(resetToken);

            customer.PasswordResetTokenExpiresAt =
                DateTime.UtcNow.AddHours(1);

            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.UpdateAsync(customer);

            await _emailService.SendPasswordResetEmailAsync(
                customer.Email,
                customer.Name,
                resetToken);

            return true;
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(newPassword))
                return false;

            var customers = await _customerRepository.GetAllAsync();

            foreach (var customer in customers)
            {
                if (string.IsNullOrWhiteSpace(customer.PasswordResetTokenHash))
                    continue;

                if (customer.PasswordResetTokenExpiresAt == null)
                    continue;

                if (customer.PasswordResetTokenExpiresAt < DateTime.UtcNow)
                    continue;

                if (BCrypt.Net.BCrypt.Verify(token, customer.PasswordResetTokenHash))
                {
                    customer.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

                    customer.PasswordResetTokenHash = null;
                    customer.PasswordResetTokenExpiresAt = null;

                    customer.UpdatedAt = DateTime.UtcNow;

                    await _customerRepository.UpdateAsync(customer);

                    return true;
                }
            }

            return false;
        }

        public async Task<bool> VerifyEmailAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return false;

            var customers = await _customerRepository.GetAllAsync();

            foreach (var customer in customers)
            {
                if (string.IsNullOrWhiteSpace(customer.EmailVerificationTokenHash))
                    continue;

                if (customer.EmailVerificationTokenExpiresAt == null)
                    continue;

                if (customer.EmailVerificationTokenExpiresAt < DateTime.UtcNow)
                    continue;

                if (BCrypt.Net.BCrypt.Verify(
                        token,
                        customer.EmailVerificationTokenHash))
                {
                    customer.EmailVerified = true;
                    customer.EmailVerificationTokenHash = null;
                    customer.EmailVerificationTokenExpiresAt = null;
                    customer.UpdatedAt = DateTime.UtcNow;

                    await _customerRepository.UpdateAsync(customer);

                    return true;
                }
            }

            return false;
        }

        private static string GenerateEmailVerificationOtp()
        {
            return Random.Shared
                .Next(100000, 1000000)
                .ToString();
        }

        public async Task<bool> VerifyEmailOtpAsync(
    string email,
    string otp)
        {
            if (string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(otp))
            {
                return false;
            }

            if (otp.Length != 6 ||
                !otp.All(char.IsDigit))
            {
                return false;
            }

            var customer =
                await _customerRepository.GetByEmailAsync(email);

            if (customer == null)
                return false;

            if (customer.EmailVerified)
                return false;

            if (string.IsNullOrWhiteSpace(
                    customer.EmailVerificationOtpHash))
            {
                return false;
            }

            if (!customer.EmailVerificationOtpExpiresAt.HasValue)
            {
                return false;
            }

            if (customer.EmailVerificationOtpExpiresAt.Value
                <= DateTime.UtcNow)
            {
                return false;
            }

            if (customer.EmailVerificationOtpAttempts >= 5)
            {
                return false;
            }

            customer.EmailVerificationOtpAttempts++;

            if (!BCrypt.Net.BCrypt.Verify(
                    otp,
                    customer.EmailVerificationOtpHash))
            {
                await _customerRepository.UpdateAsync(customer);

                return false;
            }

            customer.EmailVerified = true;

            customer.EmailVerificationOtpHash = null;

            customer.EmailVerificationOtpExpiresAt = null;

            customer.EmailVerificationOtpAttempts = 0;

            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.UpdateAsync(customer);

            return true;
        }

        public async Task<bool> ResendVerificationAsync(string email)
        {
            var customer =
                await _customerRepository.GetByEmailAsync(email);

            if (customer == null)
                return false;

            if (customer.EmailVerified)
                return false;

            // Generate a new 6-digit OTP
            var otp = GenerateEmailVerificationOtp();

            // Store only the hashed OTP
            customer.EmailVerificationOtpHash =
                BCrypt.Net.BCrypt.HashPassword(otp);

            // OTP expires after 10 minutes
            customer.EmailVerificationOtpExpiresAt =
                DateTime.UtcNow.AddMinutes(10);

            // Reset failed attempt count
            customer.EmailVerificationOtpAttempts = 0;

            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.UpdateAsync(customer);

            // Send OTP to customer's email
            await _emailService.SendVerificationOtpEmailAsync(
                customer.Email,
                customer.Name,
                otp);

            return true;
        }


    }
}