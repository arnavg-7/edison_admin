import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { schools } from "@/lib/data/schools";
import { atRiskStudents, numberOfStudents, totalFaculty } from "@/lib/data/dashboard";
import { attendanceRateBySchool, teacherStudentRatioBySchool } from "@/lib/data/homeDashboardCharts";

/**
 * The real backend boundary for exports — this route runs server-side and
 * does the filtering before anything is sent to the client, same principle
 * a database-backed version would follow. The "database" underneath is still
 * the in-memory mock modules in src/lib/data/* (see PRODUCT.md: nothing is
 * live yet), so this filters and formats real request/response semantics
 * around data that is itself still a placeholder.
 *
 * Only two categories are wired up: Attendance and Full Report. Grades/Marks
 * and Faculty Logs have no data model anywhere in this app — building them
 * would mean inventing a dataset from nothing, which is exactly what this
 * project's own "data honesty over polish" principle argues against.
 */

export type ExportCategory = "attendance" | "full_report";
export type ExportEntityType = "student" | "faculty" | "all";
export type ExportFormat = "csv" | "xlsx";

type ExportRow = [string, string];

const CSV_CONTENT_TYPE = "text/csv;charset=utf-8;";
const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function toCsvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsv(header: string[], rows: ExportRow[]): string {
  return [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
}

async function toXlsxBuffer(sheetName: string, header: string[], rows: ExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow(header).font = { bold: true };
  for (const row of rows) sheet.addRow(row);
  sheet.columns.forEach((column, index) => {
    column.width = Math.max(16, ...rows.map((row) => String(row[index] ?? "").length + 2));
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** Attendance has no per-faculty dataset anywhere in this app — a "Faculty
    Only" request against it is a real, honest empty result, not a bug. */
function attendanceRows(entityType: ExportEntityType, institutionId: string | null): ExportRow[] {
  if (entityType === "faculty") return [];

  const institution = institutionId ? schools.find((school) => school.id === institutionId) : null;
  return attendanceRateBySchool
    .filter((row) => !institution || row.school === institution.name)
    .map((row) => [row.school, `${row.rate}%`]);
}

/** The same six KPI figures Reporting & Analytics' Metrics Catalog shows,
    tagged by entity so the entity filter has something real to act on. */
function fullReportRows(entityType: ExportEntityType, institutionId: string | null): ExportRow[] {
  const institution = institutionId ? schools.find((school) => school.id === institutionId) : null;

  const studentRows: ExportRow[] = [
    ["Number of Students", String(numberOfStudents)],
    ["Attendance Rate", "92.4%"],
    ["At-Risk Students", String(atRiskStudents)],
    ["Homeroom coverage", "71%"],
    ["Gen ed / special ed split", "82% / 18%"]
  ];
  const facultyRows: ExportRow[] = [
    ["Total Faculty", String(totalFaculty)],
    ["Assignment Completion Rate", "84.7%"]
  ];

  let rows: ExportRow[] =
    entityType === "student" ? studentRows : entityType === "faculty" ? facultyRows : [...studentRows, ...facultyRows];

  // District-wide KPIs don't narrow to one school, so an institution filter
  // instead appends that school's own headcount rows — the one figure this
  // dataset actually has per school.
  if (institution) {
    const ratio = teacherStudentRatioBySchool.find((row) => row.school === institution.name);
    if (ratio) {
      const perSchoolRows: ExportRow[] = [];
      if (entityType !== "faculty") perSchoolRows.push([`${institution.name} — Students`, String(ratio.students)]);
      if (entityType !== "student") perSchoolRows.push([`${institution.name} — Faculty`, String(ratio.teachers)]);
      rows = perSchoolRows;
    }
  }

  return rows;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const category = (params.get("category") ?? "full_report") as ExportCategory;
  const entityType = (params.get("entity_type") ?? "all") as ExportEntityType;
  const institutionId = params.get("institution_id");
  const format = (params.get("format") ?? "csv") as ExportFormat;

  if (category !== "attendance" && category !== "full_report") {
    return NextResponse.json(
      { error: `Unknown category "${category}". Expected "attendance" or "full_report".` },
      { status: 400 }
    );
  }

  if (institutionId && !schools.some((school) => school.id === institutionId)) {
    return NextResponse.json({ error: `Unknown institution_id "${institutionId}".` }, { status: 400 });
  }

  const header = category === "attendance" ? ["School", "Attendance Rate"] : ["Metric", "Value"];
  const rows =
    category === "attendance"
      ? attendanceRows(entityType, institutionId)
      : fullReportRows(entityType, institutionId);

  if (rows.length === 0) {
    return NextResponse.json(
      {
        error:
          category === "attendance" && entityType === "faculty"
            ? "No data: this district has no per-faculty attendance dataset."
            : "No data matches the selected filters."
      },
      { status: 404 }
    );
  }

  const filenameBase = `${category}-export`;

  if (format === "xlsx") {
    const buffer = await toXlsxBuffer("Export", header, rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": XLSX_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`
      }
    });
  }

  if (format !== "csv") {
    return NextResponse.json(
      { error: `Unknown format "${format}". Expected "csv" or "xlsx".` },
      { status: 400 }
    );
  }

  return new NextResponse(toCsv(header, rows), {
    headers: {
      "Content-Type": CSV_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${filenameBase}.csv"`
    }
  });
}
