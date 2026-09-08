using Event_And_Parking_Manage_system.DTOs.Auth;
using Event_And_Parking_Manage_system.DTOs.Customers;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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

        // =========================================================
        // NORMAL LOGIN
        // =========================================================

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginCustomerDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            if (result == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            return Ok(result);
        }

        // =========================================================
        // GOOGLE LOGIN - START
        // =========================================================

        [HttpGet("google")]
        public IActionResult GoogleLogin()
        {
            var properties =
                new AuthenticationProperties
                {
                    RedirectUri = "/api/Auth/google-callback"
                };

            return Challenge(
                properties,
                GoogleDefaults.AuthenticationScheme);
        }

        // =========================================================
        // GOOGLE LOGIN - CALLBACK
        // =========================================================

        [HttpGet("google-callback")]
        public async Task<IActionResult> GoogleCallback()
        {
            var authenticateResult =
                await HttpContext.AuthenticateAsync("GoogleCookie");

            if (!authenticateResult.Succeeded ||
                authenticateResult.Principal == null)
            {
                return Unauthorized(new
                {
                    message = "Google authentication failed."
                });
            }

            var principal = authenticateResult.Principal;

            var email =
                principal.FindFirstValue(
                    ClaimTypes.Email);

            var name =
                principal.FindFirstValue(
                    ClaimTypes.Name);

            var googleId =
                principal.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(name) ||
                string.IsNullOrWhiteSpace(googleId))
            {
                await HttpContext.SignOutAsync("GoogleCookie");

                return BadRequest(new
                {
                    message =
                        "Required Google account information is missing."
                });
            }

            var result =
                await _authService.GoogleLoginAsync(
                    email,
                    name,
                    googleId);

            // Remove temporary Google authentication cookie
            await HttpContext.SignOutAsync("GoogleCookie");

            if (result == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Google login failed. Your account may be deactivated."
                });
            }

            // Temporary testing response
            return Ok(result);
        }

        // =========================================================
        // FORGOT PASSWORD
        // =========================================================

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(
            [FromBody] string email)
        {
            await _authService.ForgotPasswordAsync(email);

            return Ok(new
            {
                message =
                    "If the email exists, a password reset OTP will be sent."
            });
        }

        // =========================================================
        // RESET PASSWORD
        // =========================================================

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
                        "Invalid or expired reset authorization token."
                });
            }

            return Ok(new
            {
                message =
                    "Password reset successfully."
            });
        }

        // =========================================================
        // VERIFY EMAIL USING TOKEN
        // =========================================================

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

        // =========================================================
        // VERIFY PASSWORD RESET OTP
        // =========================================================

        [HttpPost("verify-password-reset-otp")]
        public async Task<IActionResult> VerifyPasswordResetOtp(
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
                await _authService.VerifyPasswordResetOtpAsync(
                    dto.Email,
                    dto.Otp);

            if (result == null)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid, expired, or maximum-attempts-exceeded OTP."
                });
            }

            return Ok(result);
        }

        // =========================================================
        // VERIFY EMAIL OTP
        // =========================================================

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

        // =========================================================
        // RESEND VERIFICATION
        // =========================================================

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