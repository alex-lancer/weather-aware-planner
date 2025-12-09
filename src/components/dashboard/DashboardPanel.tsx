import React from 'react';
import { Link } from 'react-router-dom';
import BaseButton from '../../commonComponents/BaseButton';

export default function DashboardPanel() {
  return (
    <div>
      <div>Dashboard</div>
      <Link to="/dashboard/task">
        <BaseButton variant="primary">Create new taks</BaseButton>
      </Link>
    </div>
  );
}
