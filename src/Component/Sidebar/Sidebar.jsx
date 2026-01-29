import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaTruck,
  FaOilCan,
  FaUsers,
  FaCity,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaTools,   // 🔧 Icon for Maintenance
  FaFileAlt   // 📄 Icon for Report
} from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 🔹 Mobile Navbar */}
      <div className="mobile-navbar">
        <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
        <h2 className="mobile-title">Admin Panel</h2>
      </div>

      {/* 🔹 Desktop Sidebar */}
      <div className="sidebar">
        <h2>Admin Panel</h2>
        <ul>
          <li><Link to="/admin-dashboard"><FaTachometerAlt /> Dashboard</Link></li>
          <li><Link to="/fleet"><FaTruck /> Fleet Management</Link></li>
          <li><Link to="/oil"><FaOilCan /> Oil Management</Link></li>
          <li><Link to="/users"><FaUsers /> User Management</Link></li>
          <li><Link to="/city"><FaCity /> City Operation</Link></li>
          <li><Link to="/maintenance"><FaTools /> Maintenance</Link></li>
          <li><Link to="/reports"><FaFileAlt /> Reports</Link></li> {/* ✅ Added */}
          <li><Link to="/"><FaSignOutAlt /> Logout</Link></li>
        </ul>
      </div>

      {/* 🔹 Mobile Dropdown Menu */}
      {isOpen && (
        <div className="mobile-menu">
          <ul>
            <li><Link to="/admin-dashboard" onClick={() => setIsOpen(false)}><FaTachometerAlt /> Dashboard</Link></li>
            <li><Link to="/fleet" onClick={() => setIsOpen(false)}><FaTruck /> Fleet Management</Link></li>
            <li><Link to="/oil" onClick={() => setIsOpen(false)}><FaOilCan /> Oil Management</Link></li>
            <li><Link to="/users" onClick={() => setIsOpen(false)}><FaUsers /> User Management</Link></li>
            <li><Link to="/city" onClick={() => setIsOpen(false)}><FaCity /> City Operation</Link></li>
            <li><Link to="/maintenance" onClick={() => setIsOpen(false)}><FaTools /> Maintenance</Link></li>
            <li><Link to="/reports" onClick={() => setIsOpen(false)}><FaFileAlt /> Reports</Link></li> {/* ✅ Added */}
            <li><Link to="/" onClick={() => setIsOpen(false)}><FaSignOutAlt /> Logout</Link></li>
          </ul>
        </div>
      )}
    </>
  );
};

export default Sidebar;
