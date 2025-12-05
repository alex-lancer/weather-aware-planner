import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardView from '../views/DashboardView';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
