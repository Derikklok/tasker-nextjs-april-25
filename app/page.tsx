import { Attendance } from "@/types/Attendance";
import { CreateTaskButton } from "@/components/create-task-button";
import { ModeToggle } from "@/components/ModeToggle";
import { BatchAttendanceButton } from "@/components/batch-attendance-button";
import { AttendanceTable } from "@/components/attendance-table";

const API = "https://69967dd07d178643657454ec.mockapi.io/api/v1/attendance";

async function getAttendance(): Promise<Attendance[]> {
  const res = await fetch(API, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch attendance records");
  return res.json();
}

export default async function Home() {
  const records: Attendance[] = await getAttendance();

  return (
    <main className="max-w-5xl mx-auto mt-4 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Attendance 🎓
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {records.length} record{records.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <BatchAttendanceButton />
          <CreateTaskButton />
        </div>
      </div>

      <AttendanceTable records={records} />
    </main>
  );
}