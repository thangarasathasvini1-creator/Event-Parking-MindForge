using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system.Middleware;

public class ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception ex) when (!context.Response.HasStarted)
        {
            var (status, message) = ex switch
            {
                UnauthorizedAccessException => (403, ex.Message),
                KeyNotFoundException => (404, ex.Message),
                ArgumentException => (400, ex.Message),
                DbUpdateConcurrencyException => (409, "This record changed. Refresh and try again."),
                DbUpdateException => (409, "The operation conflicts with an existing record or reservation."),
                SqlException sql when sql.Number is 1205 or 51001 or 2601 or 2627 => (409, "Another request is changing this record. Refresh and try again."),
                InvalidOperationException => (409, ex.Message),
                _ => (500, "Unable to complete the request. Please try again.")
            };
            if (status == 500) logger.LogError(ex, "Unhandled API error");
            context.Response.StatusCode = status;
            await context.Response.WriteAsJsonAsync(new { message });
        }
    }
}
