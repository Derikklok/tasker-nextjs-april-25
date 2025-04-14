import { Task } from "@/types/Task"
import { CreateTaskButton } from "@/components/create-task-button";
import { ModeToggle } from "@/components/ModeToggle";
import { TaskActions } from "@/components/task-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CircleCheckBig } from 'lucide-react';
import { Loader } from 'lucide-react';


async function getTasks() {
  const res = await fetch("https://67fd29473da09811b174e83b.mockapi.io/api/v1/tasks", {
    cache: "no-store", // Disable caching for real-time data
  });

  if (!res.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return res.json();
}

export default async function Home() {
  const tasks: Task[] = await getTasks();

  return (
    <main className="max-w-5xl mx-auto mt-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Tasker🎊</h1>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <CreateTaskButton />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Task</TableHead>
              <TableHead className="w-[30%]">Status</TableHead>
              <TableHead className="w-[20%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <span 
                    className={`inline-flex px-2 py-2 rounded-full text-sm ${
                      task.completed 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                    }`}
                  >
                    {task.completed ? <CircleCheckBig/> : <Loader/>}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <TaskActions task={task} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
};