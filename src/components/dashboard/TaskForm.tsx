import React from 'react';
import { Form, Link, useNavigation } from 'react-router-dom';
import BaseButton from '../../commonComponents/BaseButton';
import BaseSelect from '../../commonComponents/BaseSelect';
import BaseInput from '../../commonComponents/BaseInput';
import BaseTextarea from '../../commonComponents/BaseTextarea';
import CityAutocomplete from '../../commonComponents/CityAutocomplete';
import type { Task, Role, Status } from '../../types';
import { useAppSelector } from '../../store';

type TaskFormProps = {
  initial?: Partial<Task>;
  mode: 'create' | 'edit';
};

export default function TaskForm({ initial, mode }: TaskFormProps) {
  const nav = useNavigation();
  const isSubmitting = nav.state === 'submitting' || nav.state === 'loading';
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const isReadOnly = mode === 'edit' && currentUser?.role === 'technician';

  const roles: Role[] = ['manager', 'dispatcher', 'technician'];
  const statuses: Status[] = ['ToDo', 'InProgress', 'Done'];

  return (
    <Form method="post" className="space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
        <BaseInput
          id="title"
          name="title"
          required
          readOnly={isReadOnly}
          defaultValue={initial?.title ?? ''}
          placeholder="Task title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
        <BaseTextarea
          id="description"
          name="description"
          rows={4}
          readOnly={isReadOnly}
          defaultValue={initial?.description ?? ''}
          placeholder="Describe the task"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="notes">Notes</label>
        <BaseTextarea
          id="notes"
          name="notes"
          rows={3}
          readOnly={isReadOnly}
          defaultValue={initial?.notes ?? ''}
          placeholder="Additional notes (optional)"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="role">Role</label>
          <BaseSelect id="role" name="role" defaultValue={initial?.role ?? 'technician'} disabled={isReadOnly}>
            {roles.map(r => (
              <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>
            ))}
          </BaseSelect>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="date">Date</label>
          <BaseInput
            id="date"
            name="date"
            type="date"
            required
            disabled={isReadOnly}
            defaultValue={(initial?.date ? new Date(initial.date as any) : new Date()).toISOString().slice(0,10)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="durationHours">Duration (hours)</label>
          <BaseInput
            id="durationHours"
            name="durationHours"
            type="number"
            min={1}
            max={24}
            step={1}
            required
            disabled={isReadOnly}
            defaultValue={initial?.durationHours ?? 1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="city">City</label>
          <CityAutocomplete name="city" defaultValue={initial?.city ?? ''} disabled={isReadOnly as any} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="status">Status</label>
        <BaseSelect id="status" name="status" defaultValue={initial?.status ?? 'ToDo'} disabled={isReadOnly}>
          {statuses.map(s => (
            <option key={s} value={s}>{s === 'ToDo' ? 'To Do' : s === 'InProgress' ? 'In Progress' : 'Done'}</option>
          ))}
        </BaseSelect>
      </div>

      <div className="flex gap-2">
        <BaseButton type="submit" variant="primary" disabled={isSubmitting || isReadOnly}>
          {isReadOnly
            ? 'Read‑only'
            : (isSubmitting ? (mode === 'create' ? 'Creating…' : 'Saving…') : (mode === 'create' ? 'Create Task' : 'Save Changes'))}
        </BaseButton>
        <Link to="/">
          <BaseButton type="button" variant="secondary" disabled={isSubmitting}>
            Cancel
          </BaseButton>
        </Link>
      </div>
      {isReadOnly && (
        <p className="text-xs text-gray-600">Technicians cannot edit tasks. Fields are read‑only.</p>
      )}
    </Form>
  );
}
