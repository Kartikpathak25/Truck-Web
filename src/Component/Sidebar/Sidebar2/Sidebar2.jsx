// src/Component/Sidebar/Sidebar2/Sidebar2.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaOilCan, FaTools, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import "./Sidebar2.css";

const menuItems = [
  { to: "/tanker-dashboard", label: "Dashboard", icon: FaTachometerAlt },
  { to: "/tankeroil", label: "Oil Management", icon: FaOilCan },
  { to: "/tankermaintenance", label: "Maintenance", icon: FaTools },
];

const Sidebar2 = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    // Close mobile menu
    closeMenu();

    // Clear all auth data
    localStorage.removeItem('loggedUser');
    sessionStorage.clear();

    // Navigate to login with replace
    navigate('/', { replace: true, state: { loggedOut: true } });

    // Prevent back button navigation
    window.history.pushState(null, '', '/');
  };

  return (
    <>
      {/* 🔹 Mobile Navbar */}
      <div className="mobile-navbar">
        <button
          className="menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
        <h2 className="mobile-title">Tanker Dashboard</h2>
      </div>

      {/* 🔹 Desktop Sidebar */}
      <aside className="sidebar2">
        <div className="sidebar-header">
          <h2>Tanker Dashboard</h2>
        </div>

        <nav>
          <ul>
            {menuItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active" : ""}`
                  }
                  onClick={closeMenu}
                >
                  <item.icon className="nav-icon" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}

            {/* Logout button */}
            <li>
              <button
                className="nav-link logout"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="nav-icon" />
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* 🔹 Mobile Slide-in Menu */}
      <div className={`mobile-menu ${isOpen ? "open" : ""}`}>
        <div className="mobile-menu-header">
          <h3>Menu</h3>
          <button onClick={closeMenu} aria-label="Close menu">
            <FaTimes />
          </button>
        </div>

        <ul>
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
                onClick={closeMenu}
              >
                <item.icon className="nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}

          {/* Logout button */}
          <li>
            <button
              className="nav-link logout"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="nav-icon" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Backdrop for mobile menu */}
      {isOpen && <div className="backdrop" onClick={closeMenu} />}
    </>
  );
};

export default Sidebar2;