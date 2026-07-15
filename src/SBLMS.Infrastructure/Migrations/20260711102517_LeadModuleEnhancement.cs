using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SBLMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LeadModuleEnhancement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AnnualRevenue",
                table: "Leads",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CampaignSource",
                table: "Leads",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EmployeeCount",
                table: "Leads",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Fax",
                table: "Leads",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LeadSourceDetails",
                table: "Leads",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LinkedInUrl",
                table: "Leads",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SkypeId",
                table: "Leads",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaxId",
                table: "Leads",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LeadAddresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    Label = table.Column<int>(type: "integer", nullable: false),
                    AddressLine1 = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AddressLine2 = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    State = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadAddresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeadAddresses_Leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LeadContactPersons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LeadId = table.Column<Guid>(type: "uuid", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Designation = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Mobile = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    LastModifiedBy = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeadContactPersons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LeadContactPersons_Leads_LeadId",
                        column: x => x.LeadId,
                        principalTable: "Leads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_CompanyName",
                table: "Leads",
                column: "CompanyName",
                unique: true,
                filter: "\"CompanyName\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_LeadAddresses_LeadId_Label",
                table: "LeadAddresses",
                columns: new[] { "LeadId", "Label" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LeadContactPersons_LeadId_SortOrder",
                table: "LeadContactPersons",
                columns: new[] { "LeadId", "SortOrder" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LeadAddresses");

            migrationBuilder.DropTable(
                name: "LeadContactPersons");

            migrationBuilder.DropIndex(
                name: "IX_Leads_CompanyName",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "AnnualRevenue",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "CampaignSource",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "EmployeeCount",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "Fax",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "LeadSourceDetails",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "LinkedInUrl",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "SkypeId",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "TaxId",
                table: "Leads");
        }
    }
}
