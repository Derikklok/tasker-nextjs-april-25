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
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Loader2, Users } from "lucide-react";
import { Subject } from "@/types/Subject";
import { Student } from "@/types/Student";

const ATTENDANCE_API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/attendance";
const SUBJECTS_API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/subjects";
const STUDENTS_API = "https://69968b2a7d17864365748134.mockapi.io/api/v1/students";

const BATCHES = ["BSE", "BCS", "BCE"] as const;
type Batch = (typeof BATCHES)[number];

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function BatchAttendanceButton() {
  const [open, setOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("__new__");
  const [newSubjectName, setNewSubjectName] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch>("BSE");

  const [present, setPresent] = useState(true);
  const [date, setDate] = useState(getToday());

  // progress tracking
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Fetch subjects + students when dialog opens
  useEffect(() => {
    if (!open) return;
    setDate(getToday());
    setProgress(null);
    setIsFetching(true);
    Promise.all([fetch(SUBJECTS_API), fetch(STUDENTS_API)])
      .then(([sr, str]) => Promise.all([sr.json(), str.json()]))
      .then(([subjectData, studentData]) => {
        const subs = Array.isArray(subjectData) ? (subjectData as Subject[]) : [];
        const studs = Array.isArray(studentData) ? (studentData as Student[]) : [];
        setSubjects(subs);
        setSelectedSubjectId(subs.length > 0 ? subs[0].id : "__new__");
        setStudents(studs);
      })
      .catch((e) => console.error("Failed to load data", e))
      .finally(() => setIsFetching(false));
  }, [open]);

  const batchStudents = students.filter((s) => s.batch === selectedBatch);

  const resolvedSubjectName =
    selectedSubjectId === "__new__"
      ? newSubjectName.trim()
      : subjects.find((s) => s.id === selectedSubjectId)?.name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedSubjectName || batchStudents.length === 0) return;
    setIsLoading(true);
    setProgress({ done: 0, total: batchStudents.length });

    try {
      // If it's a new subject, POST it first
      if (selectedSubjectId === "__new__") {
        const subjectRes = await fetch(SUBJECTS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: resolvedSubjectName }),
        });
        if (!subjectRes.ok) throw new Error("Failed to save subject");
      }

      // POST attendance for every student in the batch, 5 at a time
      const BATCH_SIZE = 5;
      let done = 0;

      for (let i = 0; i < batchStudents.length; i += BATCH_SIZE) {
        const chunk = batchStudents.slice(i, i + BATCH_SIZE);
        await Promise.all(
          chunk.map((student) =>
            fetch(ATTENDANCE_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                subject: resolvedSubjectName,
                student_registration: student.registration,
                present: String(present),
                date,
              }),
            })
          )
        );
        done += chunk.length;
        setProgress({ done, total: batchStudents.length });
      }

      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error adding batch attendance:", error);
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="mr-2 h-4 w-4" />
          Batch Attendance
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add Batch Attendance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Batch selector */}
          <div className="space-y-1">
            <Label htmlFor="batch">Batch</Label>
            <select
              id="batch"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value as Batch)}
              disabled={isLoading || isFetching}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              {BATCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {!isFetching && batchStudents.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {batchStudents.length} student{batchStudents.length !== 1 ? "s" : ""} in this batch
              </p>
            )}
          </div>

          {/* Subject selector */}
          <div className="space-y-1">
            <Label htmlFor="batch-subject">Subject</Label>
            <select
              id="batch-subject"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={isLoading || isFetching}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              {isFetching ? (
                <option value="">Loading…</option>
              ) : (
                <>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                  <option value="__new__">+ Add new subject…</option>
                </>
              )}
            </select>
            {selectedSubjectId === "__new__" && !isFetching && (
              <Input
                id="batch-new-subject"
                placeholder="e.g. Mathematics"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
                className="mt-2"
              />
            )}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label htmlFor="batch-date">Date</Label>
            <Input
              id="batch-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Present toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="batch-present"
              checked={present}
              onCheckedChange={setPresent}
              disabled={isLoading}
            />
            <Label htmlFor="batch-present">{present ? "Mark all Present" : "Mark all Absent"}</Label>
          </div>

          {/* Progress bar while submitting */}
          {progress && (
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-200"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {progress.done} / {progress.total}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isFetching || batchStudents.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving {progress ? `${progress.done}/${progress.total}` : ""}…
              </>
            ) : (
              `Save ${batchStudents.length > 0 ? batchStudents.length : ""} Records`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
