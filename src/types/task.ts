import { Role } from "./role";

export type Status = "ToDo" | "InProgress" | "Done";

export type Task = {
  id: string;
  title: string;
  description?: string;
  date: string;
  role: Role;
  city: string;
  durationHours: number;
  status: Status;
  notes?: string;
};
