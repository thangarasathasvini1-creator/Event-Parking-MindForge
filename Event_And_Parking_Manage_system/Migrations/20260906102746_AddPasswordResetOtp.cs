using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Event_And_Parking_Manage_system.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetOtp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordResetAuthorizationTokenExpiresAt",
                table: "Customers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordResetAuthorizationTokenHash",
                table: "Customers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PasswordResetOtpAttempts",
                table: "Customers",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordResetOtpExpiresAt",
                table: "Customers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordResetOtpHash",
                table: "Customers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordResetAuthorizationTokenExpiresAt",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "PasswordResetAuthorizationTokenHash",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "PasswordResetOtpAttempts",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "PasswordResetOtpExpiresAt",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "PasswordResetOtpHash",
                table: "Customers");
        }
    }
}
