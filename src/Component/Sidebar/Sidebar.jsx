import React from 'react';
import { Link } from 'react-router-dom';   // <-- use Link instead of <a>
import {
  FaTachometerAlt,     // Dashboard
  FaTruck,             // Fleet Management
  FaOilCan,            // Oil Management
  FaUsers,             // User Management
  FaCity,              // City Operation
  FaSignOutAlt         // Logout
} from 'react-icons/fa';

import styles from './Sidebar.css'; 

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2 className={styles.title}>Admin Panel</h2>
      <ul className={styles.navList}>
        <li>
          <Link to="/admin-dashboard" className={styles.navItem}>
            <FaTachometerAlt className={styles.icon} />
            Dashboard 
          </Link>
        </li>
        <li>
          <Link to="/fleet" className={styles.navItem}>
            <FaTruck className={styles.icon} />
            Fleet Management
          </Link>
        </li>
        <li>
          <Link to="/oil" className={styles.navItem}>
            <FaOilCan className={styles.icon} />
            Oil Management
          </Link>
        </li>
        <li>
          <Link to="/users" className={styles.navItem}>
            <FaUsers className={styles.icon} />
            User Management
          </Link>
        </li>
        <li>
          <Link to="/city" className={styles.navItem}>
            <FaCity className={styles.icon} />
            City Operation
          </Link>
        </li>
        <li>
          <Link to="/" className={styles.navItem}>
            <FaSignOutAlt className={styles.icon} />
            Logout
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
