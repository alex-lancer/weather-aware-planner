import React from 'react';
import { useLoaderData } from 'react-router-dom';
import TaskForm from './TaskForm';
import type { Task } from '../../types';

export default function EditTask() {
  const task = useLoaderData() as Task;
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Edit task</h2>
      <TaskForm mode="edit" initial={task} />
    </div>
  );
}
