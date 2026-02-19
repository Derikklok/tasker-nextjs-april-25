"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
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
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Attendance } from "@/types/Attendance";
import { Subject } from "@/types/Subject";
import { Loader2, Pencil, Trash2 } from "lucide-react";

const API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/attendance";
const SUBJECTS_API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/subjects";

interface AttendanceActionsProps {
  record: Attendance;
}

export function TaskActions({ record }: AttendanceActionsProps) {
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("__current__");
  const [isFetchingSubjects, setIsFetchingSubjects] = useState(false);
  const [studentReg, setStudentReg] = useState(record.student_registration);
  const [present, setPresent] = useState(record.present === "true");
  const [date, setDate] = useState(
    record.date ? record.date.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch subjects when dialog opens
  useEffect(() => {
    if (!open) return;
    setIsFetchingSubjects(true);
    fetch(SUBJECTS_API)
      .then((r) => r.json())
      .then((data: Subject[]) => {
        setSubjects(data);
        // Try to match the record's subject name to an id
        const match = data.find((s) => s.name === record.subject);
        setSelectedSubjectId(match ? match.id : "__current__");
      })
      .catch((e) => console.error("Failed to load subjects", e))
      .finally(() => setIsFetchingSubjects(false));
  }, [open, record.subject]);

  const resolvedSubjectName =
    selectedSubjectId === "__current__"
      ? record.subject
      : subjects.find((s) => s.id === selectedSubjectId)?.name ?? record.subject;

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(true);

    try {
      const response = await fetch(`${API}/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: resolvedSubjectName,
          student_registration: studentReg,
          present: String(present),
          date,
        }),
      });

      if (!response.ok) throw new Error("Failed to update record");

      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating attendance:", error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`${API}/${record.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete record");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting attendance:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-subject">Subject</Label>
              <select
                id="edit-subject"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={isEditing || isFetchingSubjects}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              >
                {isFetchingSubjects ? (
                  <option value="__current__">Loading subjects…</option>
                ) : (
                  <>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    {/* Fallback: keep current subject if no match found */}
                    {!subjects.find((s) => s.name === record.subject) && (
                      <option value="__current__">{record.subject}</option>
                    )}
                  </>
                )}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-reg">Student Registration No.</Label>
              <Input
                id="edit-reg"
                placeholder="Registration Number"
                value={studentReg}
                onChange={(e) => setStudentReg(e.target.value)}
                required
                disabled={isEditing}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={isEditing}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-present"
                checked={present}
                onCheckedChange={setPresent}
                disabled={isEditing}
              />
              <Label htmlFor="edit-present">{present ? "Present" : "Absent"}</Label>
            </div>
            <Button type="submit" className="w-full" disabled={isEditing || isFetchingSubjects}>
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the attendance record for{" "}
              <strong>{record.student_registration}</strong> in{" "}
              <strong>{record.subject}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
