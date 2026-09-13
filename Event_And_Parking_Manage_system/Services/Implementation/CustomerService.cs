using Event_And_Parking_Manage_system.Helpers;
using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.DTOs.Customers;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;

namespace Event_And_Parking_Manage_system.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICustomerRepository _customerRepository;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public CustomerService(ApplicationDbContext context, 
            ICustomerRepository customerRepository,
            IEmailService emailService, IConfiguration configuration)
        {
            _context = context;
            _customerRepository = customerRepository;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<CustomerDto?> GetByIdAsync(int customerId)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);

            if (customer == null)
                return null;

            var result = MapToDto(customer);
            result.TotalBookings = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.CountAsync(_context.Bookings.Where(b => b.CustomerId == customerId));
            result.UpcomingBookings = await _customerRepository.GetUpcomingBookingsCountAsync(customerId);
            return result;
        }

        public async Task<IEnumerable<CustomerDto>> GetAllAsync(string? search = null)
        {
            var customers = await _customerRepository.GetAllAsync(search);

            return customers.Select(MapToDto);
        }

        public async Task<CustomerDto> CreateAsync(RegisterCustomerDto dto)
        {
            var emailExists =
                await _customerRepository.ExistsByEmailAsync(dto.Email);

            if (emailExists)
            {
                throw new InvalidOperationException(
                    "Email already exists.");
            }

            // Generate a 6-digit email verification OTP
            var verificationOtp =
                AccountSecurity.NewOtp();

            var verificationToken = AccountSecurity.NewToken();
            var customer = new Customer
            {
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        dto.Password),

                EmailVerified = false,
                EmailVerificationTokenHash = BCrypt.Net.BCrypt.HashPassword(verificationToken),
                EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddMinutes(AccountSecurity.Minutes(_configuration, "Token")),

                // Store only the hashed OTP
                EmailVerificationOtpHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        verificationOtp),

                // OTP expires after 10 minutes
                EmailVerificationOtpExpiresAt =
                    DateTime.UtcNow.AddMinutes(AccountSecurity.Minutes(_configuration, "Token")),

                EmailVerificationOtpAttempts = 0,

                CreatedAt = DateTime.UtcNow
            };

            await _customerRepository.AddAsync(customer);

            // Send OTP email
            await _emailService.SendVerificationOtpEmailAsync(
                customer.Email,
                customer.Name,
                verificationOtp, verificationToken);

            return MapToDto(customer);
        }

        public async Task<bool> UpdateAsync(int customerId, UpdateCustomerDto dto)
        {
            var customer =
                await _customerRepository.GetByIdAsync(customerId);

            if (customer == null)
                return false;

            var existingCustomer =
                await _customerRepository.GetByEmailAsync(dto.Email);

            if (existingCustomer != null &&
                existingCustomer.CustomerId != customerId)
            {
                throw new InvalidOperationException(
                    "Email already exists.");
            }

            var emailChanged =
                !string.Equals(
                    customer.Email,
                    dto.Email,
                    StringComparison.OrdinalIgnoreCase);

            customer.Name = dto.Name;
            customer.Phone = dto.Phone;
            customer.UpdatedAt = DateTime.UtcNow;

            if (emailChanged)
            {
                customer.Email = dto.Email;

                // Require verification for the new email
                customer.EmailVerified = false;

                var verificationOtp =
                    AccountSecurity.NewOtp();

                customer.EmailVerificationOtpHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        verificationOtp);

                customer.EmailVerificationOtpExpiresAt =
                    DateTime.UtcNow.AddMinutes(AccountSecurity.Minutes(_configuration, "Token"));

                var verificationToken = AccountSecurity.NewToken();
                customer.EmailVerificationTokenHash = BCrypt.Net.BCrypt.HashPassword(verificationToken);
                customer.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddMinutes(AccountSecurity.Minutes(_configuration, "Token"));
                customer.PasswordResetAuthorizationTokenHash = null;
                customer.PasswordResetOtpHash = null;
                customer.EmailVerificationOtpAttempts = 0;

                await _customerRepository.UpdateAsync(customer);

                await _emailService.SendVerificationOtpEmailAsync(
                    customer.Email,
                    customer.Name,
                    verificationOtp, verificationToken);
            }
            else
            {
                await _customerRepository.UpdateAsync(customer);
            }

            return true;
        }

        public async Task<bool> DeleteAsync(int customerId)
        {
            await using var transaction = await _context.BeginReservationTransactionAsync();
            var customer = await _customerRepository.GetByIdAsync(customerId);

            if (customer == null)
                return false;

            var hasActiveFutureBookings =
                await _customerRepository.HasActiveFutureBookingsAsync(customerId);

            if (hasActiveFutureBookings)
            {
                throw new InvalidOperationException(
                    "Customer cannot be deactivated because they have active future bookings.");
            }

            customer.Status = Models.Enums.CustomerStatus.Deactivated;
            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.UpdateAsync(customer);
            await transaction.CommitAsync();

            return true;
        }

        private static CustomerDto MapToDto(Customer customer)
        {
            return new CustomerDto
            {
                CustomerId = customer.CustomerId,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Role = customer.Role.ToString(),
                Status = customer.Status.ToString(),
                EmailVerified = customer.EmailVerified,
                CreatedAt = customer.CreatedAt,
                UpdatedAt = customer.UpdatedAt
            };
        }

        public async Task<bool> ReactivateAsync(int customerId)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);

            if (customer == null)
                return false;

            customer.Status = Models.Enums.CustomerStatus.Active;
            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.UpdateAsync(customer);

            return true;
        }
    }
}