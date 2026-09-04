using Event_And_Parking_Manage_system.DTOs.Customers;
using Event_And_Parking_Manage_system.Models.Entities;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services.Interfaces;

namespace Event_And_Parking_Manage_system.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly IEmailService _emailService;

        public CustomerService(
            ICustomerRepository customerRepository,
            IEmailService emailService)
        {
            _customerRepository = customerRepository;
            _emailService = emailService;
        }

        public async Task<CustomerDto?> GetByIdAsync(int customerId)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);

            if (customer == null)
                return null;

            return MapToDto(customer);
        }

        public async Task<IEnumerable<CustomerDto>> GetAllAsync(string? search = null)
        {
            var customers = await _customerRepository.GetAllAsync(search);

            return customers.Select(MapToDto);
        }

        public async Task<CustomerDto> CreateAsync(RegisterCustomerDto dto)
        {
            var emailExists = await _customerRepository.ExistsByEmailAsync(dto.Email);

            if (emailExists)
            {
                throw new InvalidOperationException("Email already exists.");
            }

            var verificationToken = Guid.NewGuid().ToString("N");

            var customer = new Customer
            {
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                EmailVerified = false,
                EmailVerificationTokenHash = BCrypt.Net.BCrypt.HashPassword(verificationToken),
                EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
                CreatedAt = DateTime.UtcNow
            };

            await _customerRepository.AddAsync(customer);

            await _emailService.SendVerificationEmailAsync(
                customer.Email,
                customer.Name,
                verificationToken);

            return MapToDto(customer);
        }

        public async Task<bool> UpdateAsync(int customerId, UpdateCustomerDto dto)
        {
            var customer = await _customerRepository.GetByIdAsync(customerId);

            if (customer == null)
                return false;

            var existingCustomer =
                await _customerRepository.GetByEmailAsync(dto.Email);

            if (existingCustomer != null &&
                existingCustomer.CustomerId != customerId)
            {
                throw new InvalidOperationException("Email already exists.");
            }

            customer.Name = dto.Name;
            customer.Email = dto.Email;
            customer.Phone = dto.Phone;
            customer.UpdatedAt = DateTime.UtcNow;

            await _customerRepository.UpdateAsync(customer);

            return true;
        }

        public async Task<bool> DeleteAsync(int customerId)
        {
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