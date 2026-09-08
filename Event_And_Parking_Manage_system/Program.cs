using Event_And_Parking_Manage_system.Middleware;
using Event_And_Parking_Manage_system.Data;
using Event_And_Parking_Manage_system.Repositories;
using Event_And_Parking_Manage_system.Repositories.Implementation;
using Event_And_Parking_Manage_system.Repositories.Interfaces;
using Event_And_Parking_Manage_system.Services;
using Event_And_Parking_Manage_system.Services.Implementation;
using Event_And_Parking_Manage_system.Services.Interfaces;
using Event_And_Parking_Manage_system.Validators;
using FluentValidation;
using FluentValidation.AspNetCore;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

namespace Event_And_Parking_Manage_system
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ==========================================
            // EF Core Context Configuration
            // ==========================================

            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    builder.Configuration.GetConnectionString(
                        "DefaultConnection")));

            // ==========================================
            // Dependency Injection - Repositories
            // ==========================================

            // Member 1 - Customer
            builder.Services.AddScoped<
                ICustomerRepository,
                CustomerRepository>();

            // Member 1 - Notification
            builder.Services.AddScoped<
                INotificationRepository,
                NotificationRepository>();

            // Member 2 - Venue, Category, Event
            builder.Services.AddScoped<
                IVenueRepository,
                VenueRepository>();

            builder.Services.AddScoped<
                ICategoryRepository,
                CategoryRepository>();

            builder.Services.AddScoped<
                IEventRepository,
                EventRepository>();

            // Member 3 - Seat, Parking
            builder.Services.AddScoped<
                ISeatRepository,
                SeatRepository>();

            builder.Services.AddScoped<
                IParkingRepository,
                ParkingRepository>();

            // Member 4 - Booking
            builder.Services.AddScoped<
                IBookingRepository,
                BookingRepository>();

            // Member 4 - Payment
            builder.Services.AddScoped<
                IPaymentRepository,
                PaymentRepository>();

            // Member 4 - Admin Dashboard
            builder.Services.AddScoped<
                IAdminDashboardRepository,
                AdminDashboardRepository>();

            // ==========================================
            // Dependency Injection - Services
            // ==========================================

            // Member 1 - Customer, Dashboard, Email, Auth
            builder.Services.AddScoped<
                ICustomerService,
                CustomerService>();

            // Member 1 - Notification
            builder.Services.AddScoped<
                INotificationService,
                NotificationService>();

            builder.Services.AddScoped<
                ICustomerDashboardService,
                CustomerDashboardService>();

            builder.Services.AddScoped<
                IEmailService,
                EmailService>();

            builder.Services.AddScoped<
                IAuthService,
                AuthService>();

            // Member 2 - Venue, Category, Event
            builder.Services.AddScoped<
                IVenueService,
                VenueService>();

            builder.Services.AddScoped<
                ICategoryService,
                CategoryService>();

            builder.Services.AddScoped<
                IEventService,
                EventService>();

            // Member 3 - Seat, Parking
            builder.Services.AddScoped<
                ISeatService,
                SeatService>();

            builder.Services.AddScoped<
                IParkingService,
                ParkingService>();

            // Member 4 - Booking
            builder.Services.AddScoped<
                IBookingService,
                BookingService>();

            // Member 4 - Payment
            builder.Services.AddScoped<
                IPaymentService,
                PaymentService>();

            // Member 4 - Admin Dashboard
            builder.Services.AddScoped<
                IAdminDashboardService,
                AdminDashboardService>();

            // ==========================================
            // Background Services
            // ==========================================

            // Automatically expires pending bookings
            // after their hold period has ended.
            builder.Services.AddHostedService<
                BookingExpiryService>();

            // ==========================================
            // CORS Configuration
            // ==========================================

            // Allow Angular frontend running on localhost:4200
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AngularPolicy", policy =>
                {
                    policy
                        .WithOrigins("http://localhost:4200")
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });

            // ==========================================
            // JWT Configuration
            // ==========================================

            var jwtKey = builder.Configuration["Jwt:Key"]
                ?? throw new InvalidOperationException(
                    "JWT Key is not configured.");

            var jwtIssuer = builder.Configuration["Jwt:Issuer"];

            var jwtAudience = builder.Configuration["Jwt:Audience"];

            // ==========================================
            // Authentication
            // ==========================================

            builder.Services
                .AddAuthentication(
                    JwtBearerDefaults.AuthenticationScheme)

                // ------------------------------------------
                // JWT Authentication
                // ------------------------------------------
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters =
                        new TokenValidationParameters
                        {
                            ValidateIssuerSigningKey = true,

                            IssuerSigningKey =
                                new SymmetricSecurityKey(
                                    Encoding.UTF8.GetBytes(jwtKey)),

                            ValidateIssuer = true,
                            ValidIssuer = jwtIssuer,

                            ValidateAudience = true,
                            ValidAudience = jwtAudience,

                            ValidateLifetime = true,

                            ClockSkew = TimeSpan.Zero
                        };
                })

                // ------------------------------------------
                // Temporary Cookie for Google External Login
                // ------------------------------------------
                .AddCookie("GoogleCookie")

                // ------------------------------------------
                // Google Authentication
                // ------------------------------------------
                .AddGoogle(
                    GoogleDefaults.AuthenticationScheme,
                    options =>
                    {
                        options.ClientId =
                            builder.Configuration[
                                "Authentication:Google:ClientId"]
                            ?? throw new InvalidOperationException(
                                "Google ClientId is not configured.");

                        options.ClientSecret =
                            builder.Configuration[
                                "Authentication:Google:ClientSecret"]
                            ?? throw new InvalidOperationException(
                                "Google ClientSecret is not configured.");

                        // Temporary cookie used during
                        // Google external authentication.
                        options.SignInScheme = "GoogleCookie";

                        // Google will return here after authentication.
                        options.CallbackPath = "/signin-google";
                    });

            // ==========================================
            // Controllers & Validation
            // ==========================================

            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                });

            builder.Services.AddFluentValidationAutoValidation();

            // Register all FluentValidation validators
            // from this project assembly.
            builder.Services.AddValidatorsFromAssemblyContaining<
                BookingValidator>();

            // ==========================================
            // Swagger / OpenAPI
            // ==========================================

            builder.Services.AddEndpointsApiExplorer();

            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition(
                    "Bearer",
                    new OpenApiSecurityScheme
                    {
                        Name = "Authorization",

                        Type = SecuritySchemeType.Http,

                        Scheme = "bearer",

                        BearerFormat = "JWT",

                        In = ParameterLocation.Header,

                        Description =
                            "Enter JWT token. " +
                            "Example: Bearer {your token}"
                    });

                options.AddSecurityRequirement(
                    new OpenApiSecurityRequirement
                    {
                        {
                            new OpenApiSecurityScheme
                            {
                                Reference =
                                    new OpenApiReference
                                    {
                                        Type =
                                            ReferenceType.SecurityScheme,

                                        Id = "Bearer"
                                    }
                            },

                            Array.Empty<string>()
                        }
                    });
            });

            // ==========================================
            // Build Application
            // ==========================================

            var app = builder.Build();

            // ==========================================
            // Database Migration & Seed
            // ==========================================

            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider
                    .GetRequiredService<ApplicationDbContext>();

                // Apply pending EF Core migrations
                await context.Database.MigrateAsync();

                // Seed initial application data
                await DbSeeder.SeedAsync(context);
            }

            // ==========================================
            // Configure HTTP Request Pipeline
            // ==========================================

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();

                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            // ==========================================
            // CORS
            // ==========================================

            // Must be before Authentication / Authorization
            app.UseCors("AngularPolicy");

            // ==========================================
            // Authentication & Authorization
            // ==========================================

            app.UseAuthentication();

            app.UseAuthorization();

            app.UseMiddleware<DeactivatedUserMiddleware>();

            // ==========================================
            // Map Controllers
            // ==========================================

            app.MapControllers();

            // ==========================================
            // Run Application
            // ==========================================

            await app.RunAsync();
        }
    }
}