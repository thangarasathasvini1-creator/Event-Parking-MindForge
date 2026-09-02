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

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] string email)
        {
            await _authService.ForgotPasswordAsync(email);

            return Ok(new
            {
                message = "If the email exists, a password reset link will be sent."
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var result = await _authService.ResetPasswordAsync(
                dto.Token,
                dto.NewPassword);

            if (!result)
                return BadRequest(new
                {
                    message = "Invalid or expired reset token."
                });

            return Ok(new
            {
                message = "Password reset successfully."
            });
        }

        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return BadRequest(new
                {
                    message = "Verification token is required."
                });
            }

            var result = await _authService.VerifyEmailAsync(token);

            if (!result)
            {
                return BadRequest(new
                {
                    message = "Invalid or expired verification token."
                });
            }

            return Ok(new
            {
                message = "Email verified successfully."
            });
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification([FromBody] string email)
        {
            await _authService.ResendVerificationAsync(email);

            return Ok(new
            {
                message = "If the email exists and is not verified, a verification email will be sent."
            });
        }
    }
}