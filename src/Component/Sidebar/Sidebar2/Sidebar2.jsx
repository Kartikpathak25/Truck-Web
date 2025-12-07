import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaOilCan, FaTools, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import "./Sidebar2.css";

const Sidebar2 = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 🔹 Mobile Navbar */}
      <div className="mobile-navbar">
        <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
        <h2 className="mobile-title">Tanker Dashboard</h2>
      </div>

      {/* 🔹 Desktop Sidebar */}
      <div className="sidebar2">
        <h2>Tanker Dashboard</h2>
        <ul>
          <li><Link to="/tankeroil"><FaOilCan /> Oil Management</Link></li>
          <li><Link to="/tankermaintenance"><FaTools /> Maintenance</Link></li>
          <li><Link to="/"><FaSignOutAlt /> Logout</Link></li>
        </ul>
      </div>

      {/* 🔹 Mobile Dropdown Menu */}
      {isOpen && (
        <div className="mobile-menu">
          <ul>
            <li><Link to="/tankeroil" onClick={() => setIsOpen(false)}><FaOilCan /> Oil Management</Link></li>
            <li><Link to="/tankermaintenance" onClick={() => setIsOpen(false)}><FaTools /> Maintenance</Link></li>
            <li><Link to="/" onClick={() => setIsOpen(false)}><FaSignOutAlt /> Logout</Link></li>
          </ul>
        </div>
      )}
    </>
  );
};

export default Sidebar2;
