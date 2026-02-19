export interface Attendance {
  id: string;
  subject: string;
  student_registration: string;
  present: string; // "true" | "false"
  date: string;
}
