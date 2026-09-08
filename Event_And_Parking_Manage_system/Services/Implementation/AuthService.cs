using Event_And_Parking_Manage_system.DTOs.Auth;
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

        public AuthService(
            ICustomerRepository customerRepository,
            IConfiguration configuration,
            IEmailService emailService)
        {
            _customerRepository = customerRepository;
            _configuration = configuration;
            _emailService = emailService;
        }

        // =========================================================
        // NORMAL LOGIN
        // =========================================================

        public async Task<LoginResponseDto?> LoginAsync(
            LoginCustomerDto dto)
        {
            var customer =
                await _customerRepository.GetByEmailAsync(dto.Email);

            if (customer == null)
                return null;

            if (customer.Status != Models.Enums.CustomerStatus.Active)
                return null;

            if (!BCrypt.Net.BCrypt.Verify(
                    dto.Password,
                    customer.PasswordHash))
            {
                return null;
            }

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

        // =========================================================
        // GOOGLE LOGIN
        // =========================================================

        public async Task<LoginResponseDto?> GoogleLoginAsync(
            string email,
            string name,
            string googleId)
        {
            if (string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(name) ||
                string.IsNullOrWhiteSpace(googleId))
            {
                return null;
            }

            // Find existing customer using Google verified email
            var customer =
                await _customerRepository.GetByEmailAsync(email);

            // -----------------------------------------------------
            // EXISTING CUSTOMER
            // -----------------------------------------------------

            if (customer != null)
            {
                // Deactivated customers cannot login
                if (customer.Status !=
                    Models.Enums.CustomerStatus.Active)
                {
                    return null;
                }

                // Google has verified this email
                if (!customer.EmailVerified)
                {
                    customer.EmailVerified = true;
                    customer.UpdatedAt = DateTime.UtcNow;

                    await _customerRepository.UpdateAsync(customer);
                }

                return new LoginResponseDto
                {
                    CustomerId = customer.CustomerId,
                    Name = customer.Name,
                    Email = customer.Email,
                    Role = customer.Role.ToString(),
                    Token = GenerateJwtToken(customer)
                };
            }

            // -----------------------------------------------------
            // NEW GOOGLE CUSTOMER
            // -----------------------------------------------------

            customer = new Customer
            {
                Name = name,
                Email = email,

                // Google users don't have a normal password.
                // Generate a random unusable password hash.
                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        Guid.NewGuid().ToString()),

                Phone = string.Empty,

                // Google users are normal customers
                Role = Models.Enums.UserRole.Customer,

                Status = Models.Enums.CustomerStatus.Active,

                // Google already verified the email
                EmailVerified = true,

                CreatedAt = DateTime.UtcNow
            };

            await _customerRepository.AddAsync(customer);

            // Generate JWT for the newly created customer
            return new LoginResponseDto
            {
                CustomerId = customer.CustomerId,
                Name = customer.Name,
                Email = customer.Email,
                Role = customer.Role.ToString(),
                Token = GenerateJwtToken(customer)
            };
        }

        // =========================================================
        // JWT TOKEN GENERATION
        // =========================================================

        private string GenerateJwtToken(Customer customer)
        {
            var jwtKey = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException(
                    "JWT Key is not configured.");

            var jwtIssuer =
                _configuration["Jwt:Issuer"];

            var jwtAudience =
                _configuration["Jwt:Audience"];

            var expiryMinutes =
                _configuration.GetValue<int>(
                    "Jwt:ExpiryMinutes");

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
                expires: DateTime.UtcNow.AddMinutes(
                    expiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }

        // =========================================================
        // FORGOT PASSWORD
        // =========================================================

        public async Task<bool> ForgotPasswordAsync(
            string email)
        {
            var customer =
                await _customerRepository.GetByEmailAsync(email);

            // Do not reveal whether the email exists
            if (customer == null)
                return true;

            // Generate a new 6-digit OTP
            var otp = GeneratePasswordResetOtp();

            // Store only the hashed OTP
            customer.PasswordResetOtpHash =
                BCrypt.Net.BCrypt.HashPassword(otp);

            // OTP expires after 10 minutes
            customer.PasswordResetOtpExpiresAt =
                DateTime.UtcNow.AddMinutes(10);

            // Reset failed attempt count
            customer.PasswordResetOtpAttempts = 0;

            // Invalidate old token-based reset data
            customer.PasswordResetTokenHash = null;
            customer.PasswordResetTokenExpiresAt = null;

            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.UpdateAsync(customer);

            // Send OTP to customer's email
            await _emailService.SendPasswordResetOtpEmailAsync(
                customer.Email,
                customer.Name,
                otp);

            return true;
        }

        // =========================================================
        // RESET PASSWORD
        // =========================================================

        public async Task<bool> ResetPasswordAsync(
            string token,
            string newPassword)
        {
            if (string.IsNullOrWhiteSpace(token) ||
                string.IsNullOrWhiteSpace(newPassword))
            {
                return false;
            }

            var customers =
                await _customerRepository.GetAllAsync();

            foreach (var customer in customers)
            {
                if (string.IsNullOrWhiteSpace(
                    customer.PasswordResetAuthorizationTokenHash))
                {
                    continue;
                }

                if (!customer
                    .PasswordResetAuthorizationTokenExpiresAt
                    .HasValue)
                {
                    continue;
                }

                if (customer
                    .PasswordResetAuthorizationTokenExpiresAt
                    .Value <= DateTime.UtcNow)
                {
                    continue;
                }

                if (BCrypt.Net.BCrypt.Verify(
                    token,
                    customer.PasswordResetAuthorizationTokenHash))
                {
                    customer.PasswordHash =
                        BCrypt.Net.BCrypt.HashPassword(
                            newPassword);

                    // Invalidate reset authorization token
                    customer.PasswordResetAuthorizationTokenHash =
                        null;

                    customer.PasswordResetAuthorizationTokenExpiresAt =
                        null;

                    customer.UpdatedAt = DateTime.UtcNow;

                    await _customerRepository.UpdateAsync(
                        customer);

                    return true;
                }
            }

            return false;
        }

        // =========================================================
        // VERIFY EMAIL USING TOKEN
        // =========================================================

        public async Task<bool> VerifyEmailAsync(
            string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return false;

            var customers =
                await _customerRepository.GetAllAsync();

            foreach (var customer in customers)
            {
                if (string.IsNullOrWhiteSpace(
                    customer.EmailVerificationTokenHash))
                {
                    continue;
                }

                if (!customer
                    .EmailVerificationTokenExpiresAt
                    .HasValue)
                {
                    continue;
                }

                if (customer
                    .EmailVerificationTokenExpiresAt
                    .Value < DateTime.UtcNow)
                {
                    continue;
                }

                if (BCrypt.Net.BCrypt.Verify(
                    token,
                    customer.EmailVerificationTokenHash))
                {
                    customer.EmailVerified = true;

                    customer.EmailVerificationTokenHash =
                        null;

                    customer.EmailVerificationTokenExpiresAt =
                        null;

                    customer.UpdatedAt = DateTime.UtcNow;

                    await _customerRepository.UpdateAsync(
                        customer);

                    return true;
                }
            }

            return false;
        }

        // =========================================================
        // GENERATE EMAIL VERIFICATION OTP
        // =========================================================

        private static string GenerateEmailVerificationOtp()
        {
            return Random.Shared
                .Next(100000, 1000000)
                .ToString();
        }

        // =========================================================
        // GENERATE PASSWORD RESET OTP
        // =========================================================

        private static string GeneratePasswordResetOtp()
        {
            return Random.Shared
                .Next(100000, 1000000)
                .ToString();
        }

        // =========================================================
        // VERIFY PASSWORD RESET OTP
        // =========================================================

        public async Task<VerifyPasswordResetOtpResponseDto?>
            VerifyPasswordResetOtpAsync(
                string email,
                string otp)
        {
            if (string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(otp))
            {
                return null;
            }

            if (otp.Length != 6 ||
                !otp.All(char.IsDigit))
            {
                return null;
            }

            var customer =
                await _customerRepository.GetByEmailAsync(
                    email);

            if (customer == null)
                return null;

            if (string.IsNullOrWhiteSpace(
                customer.PasswordResetOtpHash))
            {
                return null;
            }

            if (!customer
                .PasswordResetOtpExpiresAt
                .HasValue)
            {
                return null;
            }

            if (customer
                .PasswordResetOtpExpiresAt
                .Value <= DateTime.UtcNow)
            {
                return null;
            }

            if (customer.PasswordResetOtpAttempts >= 5)
            {
                return null;
            }

            customer.PasswordResetOtpAttempts++;

            if (!BCrypt.Net.BCrypt.Verify(
                otp,
                customer.PasswordResetOtpHash))
            {
                await _customerRepository.UpdateAsync(
                    customer);

                return null;
            }

            // Generate short-lived authorization token
            var resetToken =
                Guid.NewGuid().ToString("N");

            customer.PasswordResetAuthorizationTokenHash =
                BCrypt.Net.BCrypt.HashPassword(
                    resetToken);

            customer.PasswordResetAuthorizationTokenExpiresAt =
                DateTime.UtcNow.AddMinutes(10);

            // OTP can no longer be reused
            customer.PasswordResetOtpHash = null;

            customer.PasswordResetOtpExpiresAt = null;

            customer.PasswordResetOtpAttempts = 0;

            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.UpdateAsync(
                customer);

            return new VerifyPasswordResetOtpResponseDto
            {
                ResetToken = resetToken
            };
        }

        // =========================================================
        // VERIFY EMAIL OTP
        // =========================================================

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
                await _customerRepository.GetByEmailAsync(
                    email);

            if (customer == null)
                return false;

            if (customer.EmailVerified)
                return false;

            if (string.IsNullOrWhiteSpace(
                customer.EmailVerificationOtpHash))
            {
                return false;
            }

            if (!customer
                .EmailVerificationOtpExpiresAt
                .HasValue)
            {
                return false;
            }

            if (customer
                .EmailVerificationOtpExpiresAt
                .Value <= DateTime.UtcNow)
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
                await _customerRepository.UpdateAsync(
                    customer);

                return false;
            }

            customer.EmailVerified = true;

            customer.EmailVerificationOtpHash = null;

            customer.EmailVerificationOtpExpiresAt = null;

            customer.EmailVerificationOtpAttempts = 0;

            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.UpdateAsync(
                customer);

            return true;
        }

        // =========================================================
        // RESEND EMAIL VERIFICATION OTP
        // =========================================================

        public async Task<bool> ResendVerificationAsync(
            string email)
        {
            var customer =
                await _customerRepository.GetByEmailAsync(
                    email);

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

            await _customerRepository.UpdateAsync(
                customer);

            // Send OTP to customer's email
            await _emailService.SendVerificationOtpEmailAsync(
                customer.Email,
                customer.Name,
                otp);

            return true;
        }
    }
}