import React from 'react';
import { createBrowserRouter, redirect } from 'react-router-dom';
import Planner from 'components/Planner';
import NewTask from 'components/TaskEdit/NewTask';
import EditTask from 'components/TaskEdit/EditTask';
import { plannerLoader } from 'services/LoaderService';
import { newTaskAction, editTaskAction, taskLoader, rescheduleTaskAction } from 'services/TaskActions';
import Login from 'components/Login';
import { loginAction, logoutAction, requireAuthLoader } from 'services/AuthActions';

function RootLayout(props: { children?: React.ReactNode }) {
  return React.createElement(
    'div',
    { className: 'min-h-screen bg-slate-50 text-slate-900' },
    props.children
  );
}

const errorElement = RootLayout({
  children: React.createElement(
    'div',
    { className: 'p-6' },
    [
      React.createElement('h1', { className: 'text-lg font-semibold', key: 'h' }, 'Something went wrong'),
      React.createElement(
        'p',
        { className: 'text-sm text-gray-600', key: 'p' },
        'Failed to load planner data.'
      ),
    ]
  ),
});

export const router = createBrowserRouter([
  {
    path: '/',
    element: RootLayout({ children: React.createElement(Planner) }),
    loader: async (args) => {
      const result = await requireAuthLoader(args);
      if (result) {
        return result;
      }
      return await plannerLoader(args);
    },
    errorElement,
  },
  {
    path: '/dashboard/task',
    element: RootLayout({ children: React.createElement(NewTask) }),
    loader: requireAuthLoader,
    action: newTaskAction,
  },
  {
    path: '/dashboard/task/:id',
    element: RootLayout({ children: React.createElement(EditTask) }),
    loader: async (args) => {
      const result = await requireAuthLoader(args);
      if (result) return result;
      return await taskLoader(args);
    },
    action: editTaskAction,
  },
  {
    path: '/dashboard/task/:id/reschedule',
    action: rescheduleTaskAction,
  },
  {
    path: '/login',
    element: RootLayout({ children: React.createElement(Login) }),
    action: loginAction,
  },
  {
    path: '/logout',
    action: logoutAction,
  },
  {
    path: '*',
    loader: () => redirect('/'),
  },
]);
