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

const ATTENDANCE_API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/attendance";
const SUBJECTS_API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/subjects";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function CreateTaskButton() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("__new__");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [studentReg, setStudentReg] = useState("");
  const [present, setPresent] = useState(true);
  const [date, setDate] = useState(getToday());
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSubjects, setIsFetchingSubjects] = useState(false);

  // Fetch subjects & reset date when dialog opens
  useEffect(() => {
    if (!open) return;
    setDate(getToday());
    setIsFetchingSubjects(true);
    fetch(SUBJECTS_API)
      .then((r) => r.json())
      .then((data: Subject[]) => {
        setSubjects(data);
        if (data.length > 0) setSelectedSubjectId(data[0].id);
        else setSelectedSubjectId("__new__");
      })
      .catch((e) => console.error("Failed to load subjects", e))
      .finally(() => setIsFetchingSubjects(false));
  }, [open]);

  const resolvedSubjectName =
    selectedSubjectId === "__new__"
      ? newSubjectName.trim()
      : subjects.find((s) => s.id === selectedSubjectId)?.name ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedSubjectName) return;
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
          student_registration: studentReg,
          present: String(present),
          date,
        }),
      });

      if (!response.ok) throw new Error("Failed to add record");

      // Reset form
      setSelectedSubjectId("__new__");
      setNewSubjectName("");
      setStudentReg("");
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
      <DialogContent>
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
              disabled={isLoading || isFetchingSubjects}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              {isFetchingSubjects ? (
                <option value="">Loading subjects…</option>
              ) : (
                <>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                  <option value="__new__">+ Add new subject…</option>
                </>
              )}
            </select>
            {selectedSubjectId === "__new__" && !isFetchingSubjects && (
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
          <div className="space-y-1">
            <Label htmlFor="reg">Student Registration No.</Label>
            <Input
              id="reg"
              placeholder="e.g. 2021-CS-001"
              value={studentReg}
              onChange={(e) => setStudentReg(e.target.value)}
              required
              disabled={isLoading}
            />
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
          <Button type="submit" className="w-full" disabled={isLoading || isFetchingSubjects}>
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
