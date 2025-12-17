import React from 'react';
import TaskForm from './TaskForm';

export default function NewTask() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Create new task</h2>
      <TaskForm mode="create" />
    </div>
  );
}
