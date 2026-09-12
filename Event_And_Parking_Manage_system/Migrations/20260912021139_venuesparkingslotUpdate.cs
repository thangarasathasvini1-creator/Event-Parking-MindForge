using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Event_And_Parking_Manage_system.Migrations
{
    /// <inheritdoc />
    public partial class venuesparkingslotUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BikeCapacity",
                table: "Venues",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BusCapacity",
                table: "Venues",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CarCapacity",
                table: "Venues",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalParkingSlots",
                table: "Venues",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "VanCapacity",
                table: "Venues",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BikeCapacity",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "BusCapacity",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "CarCapacity",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "TotalParkingSlots",
                table: "Venues");

            migrationBuilder.DropColumn(
                name: "VanCapacity",
                table: "Venues");
        }
    }
}
