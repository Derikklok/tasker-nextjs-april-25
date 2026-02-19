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
import { Loader2, ShieldCheck } from "lucide-react";
import { Subject } from "@/types/Subject";

const ATTENDANCE_API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/attendance";
const SUBJECTS_API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/subjects";

const CADETS = [
  { registration: "D/BSE/23/6597", batch: "BSE", label: "6597 — BSE" },
  { registration: "D/BCS/23/6730", batch: "BCS", label: "6730 — BCS" },
  { registration: "D/BCS/23/6731", batch: "BCS", label: "6731 — BCS" },
] as const;

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function CadetAttendanceButton() {
  const [open, setOpen] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("__new__");
  const [newSubjectName, setNewSubjectName] = useState("");

  const [date, setDate] = useState(getToday());

  // Per-cadet present state
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>(
    Object.fromEntries(CADETS.map((c) => [c.registration, true]))
  );

  // Fetch subjects when dialog opens
  useEffect(() => {
    if (!open) return;
    setDate(getToday());
    setPresentMap(Object.fromEntries(CADETS.map((c) => [c.registration, true])));
    setIsFetching(true);
    fetch(SUBJECTS_API)
      .then((r) => r.json())
      .then((data) => {
        const subs = Array.isArray(data) ? (data as Subject[]) : [];
        setSubjects(subs);
        setSelectedSubjectId(subs.length > 0 ? subs[0].id : "__new__");
      })
      .catch((e) => console.error("Failed to load subjects", e))
      .finally(() => setIsFetching(false));
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
      if (selectedSubjectId === "__new__") {
        const subjectRes = await fetch(SUBJECTS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: resolvedSubjectName }),
        });
        if (!subjectRes.ok) throw new Error("Failed to save subject");
      }

      await Promise.all(
        CADETS.map((cadet) =>
          fetch(ATTENDANCE_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: resolvedSubjectName,
              student_registration: cadet.registration,
              present: String(presentMap[cadet.registration] ?? true),
              date,
            }),
          })
        )
      );

      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error adding cadet attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ShieldCheck className="mr-2 h-4 w-4" />
          Cadet Attendance
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add Cadet Attendance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject selector */}
          <div className="space-y-1">
            <Label htmlFor="cadet-subject">Subject</Label>
            <select
              id="cadet-subject"
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
                id="cadet-new-subject"
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
            <Label htmlFor="cadet-date">Date</Label>
            <Input
              id="cadet-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Per-cadet attendance */}
          <div className="space-y-2">
            <Label>Cadets</Label>
            <div className="rounded-md border divide-y">
              {CADETS.map((cadet) => (
                <div
                  key={cadet.registration}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <span className="text-sm font-medium">{cadet.registration}</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={presentMap[cadet.registration] ?? true}
                      onCheckedChange={(val) =>
                        setPresentMap((prev) => ({ ...prev, [cadet.registration]: val }))
                      }
                      disabled={isLoading}
                      aria-label={`Toggle attendance for ${cadet.registration}`}
                    />
                    <span
                      className={`text-xs font-medium w-12 ${
                        (presentMap[cadet.registration] ?? true)
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {(presentMap[cadet.registration] ?? true) ? "Present" : "Absent"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isFetching || !resolvedSubjectName}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Cadet Records"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
