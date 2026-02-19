"use client";

import { useState } from "react";
import { Attendance } from "@/types/Attendance";
import { AttendanceToggle } from "./attendance-toggle";
import { TaskActions } from "./task-actions";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Download, Loader2, Trash2 } from "lucide-react";

const API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/attendance";

const FILTERS = ["All", "BSE", "BCS", "BCE"] as const;
type Filter = (typeof FILTERS)[number];

function getBatch(registration: string): string {
  return registration.split("/")[1] ?? "";
}

interface Props {
  records: Attendance[];
}

export function AttendanceTable({ records }: Props) {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [activeSubject, setActiveSubject] = useState<string>("All");
  const [isDeleting, setIsDeleting] = useState(false);

  // Derive sorted unique subject list from all records
  const subjects = ["All", ...Array.from(new Set(records.map((r) => r.subject))).sort()];

  const filteredRecords = records
    .filter((r) => activeFilter === "All" || getBatch(r.student_registration) === activeFilter)
    .filter((r) => activeSubject === "All" || r.subject === activeSubject);

  const handleExportCSV = () => {
    const header = ["Student Reg. No.", "Subject", "Date", "Present"];
    const rows = filteredRecords.map((r) => [
      r.student_registration,
      r.subject,
      r.date
        ? new Date(r.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "",
      r.present === "true" ? "Yes" : "No",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const subjectSlug = activeSubject === "All" ? "all-subjects" : activeSubject.replace(/\s+/g, "-");
    a.download = `attendance-${activeFilter}-${subjectSlug}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAll = async () => {
    if (filteredRecords.length === 0) return;
    setIsDeleting(true);
    try {
      const BATCH_SIZE = 5;
      for (let i = 0; i < filteredRecords.length; i += BATCH_SIZE) {
        const chunk = filteredRecords.slice(i, i + BATCH_SIZE);
        await Promise.all(
          chunk.map(async (r) => {
            const res = await fetch(`${API}/${r.id}`, { method: "DELETE" });
            // 404 means already deleted — treat as success
            if (!res.ok && res.status !== 404) {
              throw new Error(`Failed to delete ${r.id}: HTTP ${res.status}`);
            }
          })
        );
        if (i + BATCH_SIZE < filteredRecords.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
      window.location.reload();
    } catch (error) {
      console.error("Error deleting records:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Batch filter pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f}
                {f !== "All" && (
                  <span className="ml-1 text-xs opacity-70">
                    ({records.filter((r) => getBatch(r.student_registration) === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={filteredRecords.length === 0}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete{activeFilter !== "All" ? ` ${activeFilter}` : " All"}
                  {activeSubject !== "All" ? ` — ${activeSubject}` : ""}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {filteredRecords.length} attendance record
                    {filteredRecords.length !== 1 ? "s" : ""}
                    {activeFilter !== "All" ? ` for ${activeFilter}` : ""}
                    {activeSubject !== "All" ? ` in "${activeSubject}"` : ""}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll} disabled={isDeleting}>
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting…
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Subject filter pills */}
        {subjects.length > 1 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Subject:</span>
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSubject(s)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeSubject === s
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {s}
                {s !== "All" && (
                  <span className="ml-1 text-xs opacity-70">
                    ({records.filter((r) => r.subject === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Reg. No.</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                >
                  {records.length === 0
                    ? "No attendance records found. Add one to get started."
                    : `No records for ${activeFilter === "All" ? "" : activeFilter + " "}${activeSubject !== "All" ? `"${activeSubject}"` : ""}`.trim() || "No matching records."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record, index) => (
                <TableRow key={`${record.id}-${index}`}>
                  <TableCell className="font-medium">
                    {record.student_registration}
                  </TableCell>
                  <TableCell>{record.subject}</TableCell>
                  <TableCell>
                    {record.date
                      ? new Date(record.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <AttendanceToggle record={record} />
                  </TableCell>
                  <TableCell className="text-center">
                    <TaskActions record={record} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
