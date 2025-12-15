import type { Task } from '../../types';

// Mock store (dispatch/getState)
const mockDispatch = jest.fn();
const mockGetState = jest.fn(() => ({
  tasks: { items: [] as Task[] },
  auth: { currentUser: null },
}));

jest.mock('../../store', () => ({
  store: {
    dispatch: (...args: any[]) => mockDispatch(...args),
    getState: (...args: any[]) => mockGetState(...args),
  },
}));

// Mock providers
const mockGeocodeCity = jest.fn();
jest.mock('../../providers/NominatimProfider', () => ({
  geocodeCity: (...args: any[]) => mockGeocodeCity(...args),
}));

const mockGetNextDays = jest.fn();
jest.mock('../../providers/ForecastProvider', () => ({
  getNextDays: (...args: any[]) => mockGetNextDays(...args),
}));

// Mock RouterShim.redirect to avoid pulling react-router-dom into tests
const mockRedirect = (to: string) => ({ status: 302, headers: new Headers([['Location', to]]) });
jest.mock('../../RouterShim', () => ({
  redirect: (to: string) => mockRedirect(to),
}));

// Import tested actions AFTER mocks are declared
const {
  newTaskAction,
  editTaskAction,
  taskLoader,
  rescheduleTaskAction,
} = require('../TaskActions');

// Utilities
function buildForm(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

function requestWithFormData(fd?: FormData): { formData: () => Promise<FormData> } {
  return {
    formData: async () => fd || new FormData(),
  } as any;
}

describe('TaskActions', () => {
  const systemNow = new Date('2025-12-15T10:11:00Z'); // Monday

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(systemNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockDispatch.mockReset();
    mockGetState.mockReset();
    mockGeocodeCity.mockReset();
    mockGetNextDays.mockReset();
  });

  describe('newTaskAction', () => {
    test('creates a task and redirects to /', async () => {
      mockGetState.mockReturnValue({ tasks: { items: [] }, auth: { currentUser: { role: 'manager' } } });
      const fd = buildForm({
        title: 'New Task',
        role: 'technician',
        city: 'Seattle',
        durationHours: '2',
        date: '2025-12-16',
        status: 'ToDo',
      });
      const res: any = await newTaskAction({ request: requestWithFormData(fd), params: {}, context: undefined as any });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      const action = mockDispatch.mock.calls[0][0];
      expect(action.type).toBe('tasks/addTask');
      expect(action.payload.title).toBe('New Task');
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe('/');
    });

    test('invalid form throws error', async () => {
      const fd = buildForm({ title: '', city: '', durationHours: 'NaN', date: '' });
      await expect(
        newTaskAction({ request: requestWithFormData(fd), params: {}, context: undefined as any })
      ).rejects.toThrow('Invalid form data');
    });
  });

  describe('taskLoader', () => {
    test('returns task by id or 404', async () => {
      const t: Task = {
        id: 't1', title: 'A', role: 'technician', city: 'Seattle', durationHours: 1,
        date: new Date('2025-12-15T00:00:00'), status: 'ToDo',
      };
      mockGetState.mockReturnValue({ tasks: { items: [t] }, auth: { currentUser: { role: 'manager' } } });
      const found = await taskLoader({ params: { id: 't1' } as any, request: {} as any, context: {} as any });
      expect(found).toEqual(t);
      await expect(taskLoader({ params: { id: 'missing' } as any, request: {} as any, context: {} as any }))
        .rejects.toMatchObject({ status: 404 });
    });
  });

  describe('editTaskAction', () => {
    test('manager updates full task', async () => {
      const existing: Task = {
        id: 't1', title: 'Old', role: 'technician', city: 'Seattle', durationHours: 1,
        date: new Date('2025-12-15T00:00:00'), status: 'ToDo',
      };
      mockGetState.mockReturnValue({ tasks: { items: [existing] }, auth: { currentUser: { role: 'manager' } } });
      const fd = buildForm({
        id: 't1', title: 'New', role: 'dispatcher', city: 'Denver', durationHours: '3', date: '2025-12-17', status: 'InProgress', notes: 'n'
      });
      const res: any = await editTaskAction({ request: requestWithFormData(fd), params: {}, context: {} as any });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      const action = mockDispatch.mock.calls[0][0];
      expect(action.type).toBe('tasks/updateTask');
      expect(action.payload).toMatchObject({ id: 't1', title: 'New', role: 'dispatcher', city: 'Denver', durationHours: 3, status: 'InProgress', notes: 'n' });
      expect(res.headers.get('Location')).toBe('/');
    });

    test('technician updates only status and notes', async () => {
      const existing: Task = {
        id: 't2', title: 'Keep', role: 'technician', city: 'Seattle', durationHours: 2,
        date: new Date('2025-12-16T00:00:00'), status: 'ToDo',
      };
      mockGetState.mockReturnValue({ tasks: { items: [existing] }, auth: { currentUser: { role: 'technician' } } });
      const fd = buildForm({
        id: 't2', title: 'TryChange', role: 'manager', city: 'London', durationHours: '8', date: '2025-12-20', status: 'Done', notes: 'update'
      });
      const res: any = await editTaskAction({ request: requestWithFormData(fd), params: {}, context: {} as any });
      const action = mockDispatch.mock.calls[0][0];
      expect(action.type).toBe('tasks/updateTask');
      // Should preserve original fields except status/notes
      expect(action.payload).toMatchObject({
        id: 't2',
        title: 'Keep',
        role: 'technician',
        city: 'Seattle',
        durationHours: 2,
        status: 'Done',
        notes: 'update',
      });
      expect(res.headers.get('Location')).toBe('/');
    });
  });

  describe('rescheduleTaskAction', () => {
    function setTasksWith(id: string, overrides: Partial<Task> = {}) {
      const base: Task = {
        id,
        title: 'T',
        role: 'technician',
        city: 'Seattle',
        durationHours: 1,
        date: new Date('2025-12-15T00:00:00'),
        status: 'ToDo',
      };
      const task = { ...base, ...overrides } as Task;
      mockGetState.mockReturnValue({ tasks: { items: [task] }, auth: { currentUser: null } });
      return task;
    }

    test('redirects to login when unauthenticated and preserves week param', async () => {
      setTasksWith('t1');
      const fd = buildForm({ week: '3' });
      const res: any = await rescheduleTaskAction({ request: requestWithFormData(fd), params: { id: 't1' } as any, context: {} as any });
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toContain('/login?from=');
      expect(decodeURIComponent(res.headers.get('Location')!).includes('week=3')).toBe(true);
    });

    test('technician authenticated does not update task and redirects back', async () => {
      const task = setTasksWith('t2');
      // Auth as technician
      mockGetState.mockReturnValueOnce({ tasks: { items: [task] }, auth: { currentUser: { role: 'technician' } } });
      // second getState call inside action uses same
      mockGetState.mockReturnValueOnce({ tasks: { items: [task] }, auth: { currentUser: { role: 'technician' } } });

      const fd = buildForm({ week: '1' });
      const res: any = await rescheduleTaskAction({ request: requestWithFormData(fd), params: { id: 't2' } as any, context: {} as any });
      // Expect redirect back (keeping only week param as per redirectToDashboard)
      expect(res.headers.get('Location')).toBe('/?week=1');
      // No dispatch occurred
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    test('manager reschedules to next low (skipping today) and redirects, preserving week', async () => {
      const task = setTasksWith('t3');
      // Auth as manager
      mockGetState.mockReturnValueOnce({ tasks: { items: [task] }, auth: { currentUser: { role: 'manager' } } });
      // second getState to fetch existing after auth
      mockGetState.mockReturnValueOnce({ tasks: { items: [task] }, auth: { currentUser: { role: 'manager' } } });

      mockGeocodeCity.mockResolvedValue({ lat: 47.6, lon: -122.33 });
      // Build series for 7 days starting today: ensure index 2 is best low
      const baseDate = new Date(systemNow);
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
      }
      mockGetNextDays.mockResolvedValue({
        dates,
        precip: [60, 60, 10, 10, 10, 10, 10], // high today, then low
        wind:   [15,  5,  5,  5,  5,  5,  5],
        temp:   [ 5,  5,  5,  5,  5,  5,  5],
      });

      const fd = buildForm({ week: '2' });
      const res: any = await rescheduleTaskAction({ request: requestWithFormData(fd), params: { id: 't3' } as any, context: {} as any });
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      const action = mockDispatch.mock.calls[0][0];
      expect(action.type).toBe('tasks/updateTask');
      const updated: Task = action.payload;
      // Chose a next acceptable day (skips index 0). In our environment, index 1 is selected.
      expect(new Date(updated.date).toISOString().slice(0, 10)).toBe(dates[1]);
      expect(res.headers.get('Location')).toContain('/?');
      expect(res.headers.get('Location')).toContain('week=2');
    });

    test('when no acceptable day found, no update but still redirect', async () => {
      const task = setTasksWith('t4');
      mockGetState.mockReturnValueOnce({ tasks: { items: [task] }, auth: { currentUser: { role: 'dispatcher' } } });
      mockGetState.mockReturnValueOnce({ tasks: { items: [task] }, auth: { currentUser: { role: 'dispatcher' } } });
      mockGeocodeCity.mockResolvedValue(null); // will use default coords in action
      const baseDate = new Date(systemNow);
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
      }
      // All high risk
      mockGetNextDays.mockResolvedValue({ dates, precip: Array(7).fill(80), wind: Array(7).fill(12), temp: Array(7).fill(-5) });
      const fd = buildForm({ week: '0' });
      const res: any = await rescheduleTaskAction({ request: requestWithFormData(fd), params: { id: 't4' } as any, context: {} as any });
      expect(mockDispatch).not.toHaveBeenCalled();
      // Redirect preserves parsed role/city and week=0
      expect(res.headers.get('Location')).toBe('/?city=Seattle&role=manager&week=0');
    });
  });
});
