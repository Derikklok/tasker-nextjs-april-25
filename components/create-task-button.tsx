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
import { Loader2, PlusCircle } from "lucide-react";
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

export function CreateTaskButton() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("__new__");
  const [newSubjectName, setNewSubjectName] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch>("BSE");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [manualEntry, setManualEntry] = useState(false);
  const [manualReg, setManualReg] = useState("");

  const [present, setPresent] = useState(true);
  const [date, setDate] = useState(getToday());
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch subjects + students when dialog opens
  useEffect(() => {
    if (!open) return;
    setDate(getToday());
    setManualEntry(false);
    setManualReg("");
    setIsFetching(true);
    Promise.all([fetch(SUBJECTS_API), fetch(STUDENTS_API)])
      .then(([sr, str]) => Promise.all([sr.json(), str.json()]))
      .then(([subjectData, studentData]) => {
        const subjects = Array.isArray(subjectData) ? (subjectData as Subject[]) : [];
        const students = Array.isArray(studentData) ? (studentData as Student[]) : [];

        setSubjects(subjects);
        if (subjects.length > 0) setSelectedSubjectId(subjects[0].id);
        else setSelectedSubjectId("__new__");

        setStudents(students);
        const firstInBatch = students.find((s) => s.batch === "BSE");
        setSelectedStudentId(firstInBatch?.id ?? "");
      })
      .catch((e) => console.error("Failed to load data", e))
      .finally(() => setIsFetching(false));
  }, [open]);

  // When batch changes, auto-select first student in that batch
  useEffect(() => {
    const first = students.find((s) => s.batch === selectedBatch);
    setSelectedStudentId(first?.id ?? "");
  }, [selectedBatch, students]);

  const batchStudents = students.filter((s) => s.batch === selectedBatch);
  const resolvedStudentReg = manualEntry
    ? manualReg.trim()
    : students.find((s) => s.id === selectedStudentId)?.registration ?? "";

  const resolvedSubjectName =
    selectedSubjectId === "__new__"
      ? newSubjectName.trim()
      : subjects.find((s) => s.id === selectedSubjectId)?.name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedSubjectName || !resolvedStudentReg) return;
    setIsLoading(true);

    try {
      // If it's a new subject, POST it to subjects endpoint first
      if (selectedSubjectId === "__new__") {
        const subjectRes = await fetch(SUBJECTS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: resolvedSubjectName }),
        });
        if (!subjectRes.ok) throw new Error("Failed to save subject");
      }

      // POST attendance record
      const response = await fetch(ATTENDANCE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: resolvedSubjectName,
          student_registration: resolvedStudentReg,
          present: String(present),
          date,
        }),
      });

      if (!response.ok) throw new Error("Failed to add record");

      // Reset form
      setSelectedSubjectId(subjects[0]?.id ?? "__new__");
      setNewSubjectName("");
      setManualEntry(false);
      setManualReg("");
      setPresent(true);
      setDate(getToday());
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error adding attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Attendance
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add Attendance Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="subject">Subject</Label>
            <select
              id="subject"
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
                id="new-subject"
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

          {/* Student picker */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Student</Label>
              <button
                type="button"
                onClick={() => {
                  setManualEntry((v) => !v);
                  setManualReg("");
                }}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                {manualEntry ? "Select from list" : "Enter manually"}
              </button>
            </div>
            {manualEntry ? (
              <Input
                id="manual-reg"
                placeholder="e.g. D/BSE/23/0001"
                value={manualReg}
                onChange={(e) => setManualReg(e.target.value)}
                required
                disabled={isLoading}
                autoFocus
              />
            ) : (
              <div className="flex gap-2">
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value as Batch)}
                  disabled={isLoading || isFetching}
                  className="flex h-9 w-28 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                >
                  {BATCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <select
                  id="student"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={isLoading || isFetching || batchStudents.length === 0}
                  className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                >
                  {isFetching ? (
                    <option value="">Loading…</option>
                  ) : batchStudents.length === 0 ? (
                    <option value="">No students found</option>
                  ) : (
                    batchStudents.map((s) => (
                      <option key={s.id} value={s.id}>{s.registration}</option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="present"
              checked={present}
              onCheckedChange={setPresent}
              disabled={isLoading}
            />
            <Label htmlFor="present">{present ? "Present" : "Absent"}</Label>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isFetching}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Record"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
