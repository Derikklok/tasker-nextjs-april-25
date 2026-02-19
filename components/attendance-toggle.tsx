"use client";

import { useState } from "react";
import { Attendance } from "@/types/Attendance";
import { Loader2 } from "lucide-react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

const API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/attendance";

interface AttendanceToggleProps {
  record: Attendance;
}

export function AttendanceToggle({ record }: AttendanceToggleProps) {
  const [present, setPresent] = useState(record.present === "true");
  const [isLoading, setIsLoading] = useState(false);

  const toggle = async (next: boolean) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ present: String(next) }),
      });

      if (!response.ok) throw new Error("Failed to update attendance");

      setPresent(next);
    } catch (error) {
      console.error("Error toggling attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Switch
          checked={present}
          onCheckedChange={toggle}
          disabled={isLoading}
          aria-label="Toggle attendance"
        />
      )}
      <Label
        className={`text-sm font-medium ${
          present
            ? "text-green-700 dark:text-green-400"
            : "text-red-700 dark:text-red-400"
        }`}
      >
        {present ? "Present" : "Absent"}
      </Label>
    </div>
  );
}

