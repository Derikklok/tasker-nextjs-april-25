import { Attendance } from "@/types/Attendance";
import { CreateTaskButton } from "@/components/create-task-button";
import { ModeToggle } from "@/components/ModeToggle";
import { TaskActions } from "@/components/task-actions";
import { AttendanceToggle } from "@/components/attendance-toggle";
import { BatchAttendanceButton } from "@/components/batch-attendance-button";
import { AttendanceTableActions } from "@/components/attendance-table-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

      <div className="flex justify-end mb-3">
        <AttendanceTableActions records={records} />
      </div>

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
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No attendance records found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record, index) => (
                <TableRow key={`${record.id}-${index}`}>
                  <TableCell className="font-medium">{record.student_registration}</TableCell>
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
    </main>
  );
}