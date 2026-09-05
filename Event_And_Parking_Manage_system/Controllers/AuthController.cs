using Event_And_Parking_Manage_system.DTOs.Auth;
using Event_And_Parking_Manage_system.DTOs.Customers;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Event_And_Parking_Manage_system.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginCustomerDto dto)
        {
            var result =
                await _authService.LoginAsync(dto);

            if (result == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            return Ok(result);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(
            [FromBody] string email)
        {
            await _authService.ForgotPasswordAsync(email);

            return Ok(new
            {
                message =
                    "If the email exists, a password reset link will be sent."
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(
            [FromBody] ResetPasswordDto dto)
        {
            var result =
                await _authService.ResetPasswordAsync(
                    dto.Token,
                    dto.NewPassword);

            if (!result)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid or expired reset token."
                });
            }

            return Ok(new
            {
                message =
                    "Password reset successfully."
            });
        }

        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail(
            [FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return BadRequest(new
                {
                    message =
                        "Verification token is required."
                });
            }

            var result =
                await _authService.VerifyEmailAsync(token);

            if (!result)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid or expired verification token."
                });
            }

            return Ok(new
            {
                message =
                    "Email verified successfully."
            });
        }

        // ==========================================
        // POST: api/Auth/verify-email-otp
        // Verify email using 6-digit OTP
        // ==========================================

        [HttpPost("verify-email-otp")]
        public async Task<IActionResult> VerifyEmailOtp(
            [FromBody] VerifyEmailOtpDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new
                {
                    message =
                        "Verification data is required."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new
                {
                    message =
                        "Email is required."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.Otp))
            {
                return BadRequest(new
                {
                    message =
                        "OTP is required."
                });
            }

            var result =
                await _authService.VerifyEmailOtpAsync(
                    dto.Email,
                    dto.Otp);

            if (!result)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid, expired, or maximum-attempts-exceeded OTP."
                });
            }

            return Ok(new
            {
                message =
                    "Email verified successfully."
            });
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification(
            [FromBody] string email)
        {
            await _authService.ResendVerificationAsync(email);

            return Ok(new
            {
                message =
                    "If the email exists and is not verified, a verification email will be sent."
            });
        }
    }
}