import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardTask from '../components/dashboard/DashboardTask';
import Planner from "../components/Planner";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Planner />} />
      <Route path="/dashboard/task" element={<DashboardTask />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
