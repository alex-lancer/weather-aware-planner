import React, { useState } from 'react';
import BaseButton from '../../commonComponents/BaseButton';

export default function DashboardTask() {
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!description.trim() || !date) {
      setError('Please fill out both description and date.');
      return;
    }

    // For now, just show the captured values. Integrate with backend/store later.
    // eslint-disable-next-line no-alert
    alert(`Task created:\nDescription: ${description}\nDate: ${date}`);
    // Optionally, reset form
    setDescription('');
    setDate('');
  };

  return (
    <div>
      <h2>Dashboard Task</h2>
      <form onSubmit={onSubmit} noValidate>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="task-description" style={{ display: 'block', marginBottom: 4 }}>
            Description
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            style={{ width: '100%', maxWidth: 480 }}
            placeholder="Describe the task"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="task-date" style={{ display: 'block', marginBottom: 4 }}>
            Date
          </label>
          <input
            id="task-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: 12 }} role="alert">
            {error}
          </div>
        )}

        <BaseButton type="submit">Save Task</BaseButton>
      </form>
    </div>
  );
}
