import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Planner from "../components/Planner";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Planner />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
