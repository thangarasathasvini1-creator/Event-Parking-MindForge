using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Event_And_Parking_Manage_system.Migrations
{
    /// <inheritdoc />
    public partial class AddParkingSlotVehicleType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VehicleType",
                table: "ParkingSlots",
                type: "int",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VehicleType",
                table: "ParkingSlots");
        }
    }
}
