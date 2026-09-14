using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Event_And_Parking_Manage_system.Migrations
{
    /// <inheritdoc />
    public partial class AddEventBookingClosesAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "BookingClosesAt",
                table: "Events",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BookingClosesAt",
                table: "Events");
        }
    }
}
