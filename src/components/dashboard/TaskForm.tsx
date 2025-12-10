import React from 'react';
import { Form, Link, useNavigation } from 'react-router-dom';
import BaseButton from '../../commonComponents/BaseButton';
import BaseSelect from '../../commonComponents/BaseSelect';
import BaseInput from '../../commonComponents/BaseInput';
import BaseTextarea from '../../commonComponents/BaseTextarea';
import CityAutocomplete from '../../commonComponents/CityAutocomplete';
import type { Task, Role } from '../../types';

type TaskFormProps = {
  initial?: Partial<Task>;
  mode: 'create' | 'edit';
};

export default function TaskForm({ initial, mode }: TaskFormProps) {
  const nav = useNavigation();
  const isSubmitting = nav.state === 'submitting' || nav.state === 'loading';

  const roles: Role[] = ['manager', 'dispatcher', 'technician'];

  const weekdayOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  return (
    <Form method="post" className="space-y-4">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="title">Title</label>
        <BaseInput
          id="title"
          name="title"
          required
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
          defaultValue={initial?.description ?? ''}
          placeholder="Describe the task"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="role">Role</label>
          <BaseSelect id="role" name="role" defaultValue={initial?.role ?? 'technician'}>
            {roles.map(r => (
              <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>
            ))}
          </BaseSelect>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="weekday">Weekday</label>
          <BaseSelect id="weekday" name="weekday" defaultValue={String(initial?.weekday ?? 1)}>
            {weekdayOptions.map(w => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </BaseSelect>
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
            defaultValue={initial?.durationHours ?? 1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="city">City</label>
          <CityAutocomplete name="city" defaultValue={initial?.city ?? ''} />
        </div>
      </div>

      <div className="flex gap-2">
        <BaseButton type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (mode === 'create' ? 'Creating…' : 'Saving…') : (mode === 'create' ? 'Create Task' : 'Save Changes')}
        </BaseButton>
        <Link to="/">
          <BaseButton type="button" variant="secondary" disabled={isSubmitting}>
            Cancel
          </BaseButton>
        </Link>
      </div>
    </Form>
  );
}
