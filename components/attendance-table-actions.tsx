"use client";

import { useState } from "react";
import { Attendance } from "@/types/Attendance";
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
import { Download, Loader2, Trash2 } from "lucide-react";

const API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/attendance";

interface Props {
  records: Attendance[];
}

export function AttendanceTableActions({ records }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportCSV = () => {
    const header = ["Student Reg. No.", "Subject", "Date", "Present"];
    const rows = records.map((r) => [
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
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAll = async () => {
    if (records.length === 0) return;
    setIsDeleting(true);
    try {
      const BATCH_SIZE = 5;
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const chunk = records.slice(i, i + BATCH_SIZE);
        await Promise.all(
          chunk.map(async (r) => {
            const res = await fetch(`${API}/${r.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(`Failed to delete ${r.id}: HTTP ${res.status}`);
          })
        );
        // Respect mockapi rate limits between batches
        if (i + BATCH_SIZE < records.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
      window.location.reload();
    } catch (error) {
      console.error("Error deleting all records:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={records.length === 0}
      >
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={records.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all records?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {records.length} attendance record
              {records.length !== 1 ? "s" : ""}. This action cannot be undone.
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
                "Delete All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
