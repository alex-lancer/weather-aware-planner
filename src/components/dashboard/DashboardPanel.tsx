import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardPanel() {
  return (
    <div>
      <div>Dashboard</div>
      <Link to="/dashboard/task">
        <button>Create new taks</button>
      </Link>
    </div>
  );
}
