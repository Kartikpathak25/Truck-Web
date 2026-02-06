import React from "react";
import { Outlet } from "react-router-dom";
import {
  Truck,
  Fuel,
  Wrench,
  Activity,
  Search,
  Filter,
} from "lucide-react";

import Sidebar2 from "../../Component/Sidebar/Sidebar2/Sidebar2";
import './TankerDashboard.css';
const TankerDashboard = () => {
  return (
    <div className="tanker-dashboard">
      <Sidebar2 />

      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <p>Monitor tanker activity & fuel operations</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div>
              <p>Total Vehicles</p>
              <h2>6</h2>
            </div>
            <Truck />
          </div>

          <div className="stat-card green">
            <div>
              <p>Active Vehicles</p>
              <h2>3</h2>
            </div>
            <Activity />
          </div>

          <div className="stat-card orange">
            <div>
              <p>Oil Filled Today</p>
              <h2>240 L</h2>
            </div>
            <Fuel />
          </div>

          <div className="stat-card purple">
            <div>
              <p>Maintenance</p>
              <h2>3</h2>
            </div>
            <Wrench />
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-item">
            <Filter />
            <select>
              <option>Vehicle ID</option>
              <option>BR01AP2066</option>
              <option>BR01AP2075</option>
            </select>
          </div>

          <div className="filter-item search">
            <Search />
            <input type="text" placeholder="Search by Vehicle / Driver" />
          </div>

          <input type="date" className="date-filter" />
        </div>

        {/* Table */}
        <div className="table-card">
          <h3>Recent Operations</h3>

          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Vehicle ID</th>
                <th>Tanker ID</th>
                <th>Driver</th>
                <th>Location</th>
                <th>Filled (L)</th>
                <th>Date & Time</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Truck Fill</td>
                <td>BR01AP2066</td>
                <td>BR01AP2051</td>
                <td>Kabir</td>
                <td>Gujrat</td>
                <td className="highlight">240</td>
                <td>2026-02-06 00:01</td>
              </tr>

              <tr>
                <td>Pump Fill</td>
                <td>-</td>
                <td>BR01AP2051</td>
                <td>Nitishi</td>
                <td>Sasaram</td>
                <td className="highlight">405</td>
                <td>2026-01-30</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Nested Pages */}
        <Outlet />
      </div>
    </div>
  );
};

export default TankerDashboard;
