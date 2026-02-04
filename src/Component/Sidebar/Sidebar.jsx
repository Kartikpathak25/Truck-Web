// src/Component/Sidebar/Sidebar.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaTruck,
  FaOilCan,
  FaUsers,
  FaCity,
  FaTools,
  FaFileAlt,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import "./Sidebar.css";

const menuItems = [
  { to: "/admin-dashboard", label: "Dashboard", icon: FaTachometerAlt },
  { to: "/fleet", label: "Fleet Management", icon: FaTruck },
  { to: "/oil", label: "Oil Management", icon: FaOilCan },
  { to: "/users", label: "User Management", icon: FaUsers },
  { to: "/city", label: "City Operation", icon: FaCity },
  { to: "/maintenance", label: "Maintenance", icon: FaTools },
  { to: "/maintanancereports", label: "Maintenance Report", icon: FaFileAlt },
  { to: "/reports", label: "OIL Reports", icon: FaFileAlt },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    // Close mobile menu
    closeMenu();

    // Clear all auth data
    localStorage.removeItem('loggedUser');
    sessionStorage.clear();

    // Clear any Firebase auth state if needed
    // auth.signOut(); // Uncomment if you want to sign out from Firebase too

    // Navigate to login with replace and state
    navigate('/', { replace: true, state: { loggedOut: true } });

    // Prevent back button navigation
    window.history.pushState(null, '', '/');
    window.addEventListener('popstate', preventBack);
  };

  const preventBack = () => {
    window.history.pushState(null, '', '/');
  };

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="mobile-navbar">
        <button
          className="menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
        <h2 className="mobile-title">Admin Panel</h2>
      </div>

      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
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

      {/* Mobile Slide-in Menu */}
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

export default Sidebar;