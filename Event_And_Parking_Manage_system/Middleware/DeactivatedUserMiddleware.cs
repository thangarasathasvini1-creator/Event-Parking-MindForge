using System.Security.Claims;
using System.Text.Json;
using Event_And_Parking_Manage_system.Models.Enums;
using Event_And_Parking_Manage_system.Repositories.Interfaces;

namespace Event_And_Parking_Manage_system.Middleware
{
    public class DeactivatedUserMiddleware
    {
        private readonly RequestDelegate _next;

        public DeactivatedUserMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var customerIdClaim = context.User.FindFirst("CustomerId")?.Value
                    ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (int.TryParse(customerIdClaim, out var customerId))
                {
                    var customerRepository = context.RequestServices.GetRequiredService<ICustomerRepository>();
                    var customer = await customerRepository.GetByIdAsync(customerId);

                    if (customer != null && customer.Status == CustomerStatus.Deactivated)
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";

                        var response = new { message = "Account is deactivated. Please contact support." };
                        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
                        return;
                    }
                }
            }

            await _next(context);
        }
    }
}
