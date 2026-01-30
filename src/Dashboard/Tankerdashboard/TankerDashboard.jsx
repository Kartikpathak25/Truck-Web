import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar2 from '../../Component/Sidebar/Sidebar2/Sidebar2';
import './TankerDashboard.css'; // optional for styling

const TankerDashboard = () => {
  return (
    <div className="tanker-dashboard">
      {/* Sidebar on the left */}
      <Sidebar2 />

      {/* Main content area */}

      {/* Nested routes render here */}
      <div className="dashboard-content">
        <Outlet />
      </div>

    </div>
  )
};

export default TankerDashboard;
