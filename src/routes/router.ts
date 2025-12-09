import React from 'react';
import { createBrowserRouter, redirect } from 'react-router-dom';
import Planner from '../components/Planner';
import DashboardTask from '../components/dashboard/DashboardTask';
import { loader as plannerLoader } from '../services/LoaderService';

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
    loader: plannerLoader,
    errorElement,
  },
  {
    path: '/dashboard/task',
    element: RootLayout({ children: React.createElement(DashboardTask) }),
  },
  {
    path: '*',
    loader: () => redirect('/'),
  },
]);
