using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Repositories;
using Event_And_Parking_Manage_system.Repositories.Implementation;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services;
using Event_And_Parking_Manage_system.Services.Implementation;
using Event_And_Parking_Manage_system.Services.Interfaces;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;

namespace Event_And_Parking_Manage_system
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // EF Core context configuration
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    builder.Configuration.GetConnectionString("DefaultConnection")));

            // Dependency Injection for Repositories and Services

            // Customer Repository
            builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();

            // Customer Service
            builder.Services.AddScoped<ICustomerService, CustomerService>();

            // Auth Service
            builder.Services.AddScoped<IAuthService, AuthService>();

            // Member 2 - Repositories
            builder.Services.AddScoped<IVenueRepository, VenueRepository>();
            builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
            builder.Services.AddScoped<IEventRepository, EventRepository>();

            // Member 2 - Services
            builder.Services.AddScoped<IVenueService, VenueService>();
            builder.Services.AddScoped<ICategoryService, CategoryService>();
            builder.Services.AddScoped<IEventService, EventService>();

            // Add services to the container
            builder.Services.AddControllers();

            builder.Services.AddFluentValidationAutoValidation();

            // Swagger/OpenAPI
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            // Configure the HTTP request pipeline
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}