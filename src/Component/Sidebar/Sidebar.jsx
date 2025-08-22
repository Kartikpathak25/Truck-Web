import React from 'react';
import {
  FaTachometerAlt,     // Dashboard
  FaTruck,             // Fleet Management
  FaOilCan,            // Oil Management
  FaUsers,             // User Management
  FaCity,              // City Operation (custom substitute)
  FaSignOutAlt         // Logout
} from 'react-icons/fa';

import styles from './Sidebar.css'; 
const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2 className={styles.title}>Admin Panel</h2>
      <ul className={styles.navList}>
        <li>
          <a href="/admin-dashboard" className={styles.navItem}>
            <FaTachometerAlt className={styles.icon} />
             Dashboard 
          </a>
        </li>
        <li>
          <a href="/fleet" className={styles.navItem}>
            <FaTruck className={styles.icon} />
            Fleet Management
          </a>
        </li>
        <li>
          <a href="/oil" className={styles.navItem}>
            <FaOilCan className={styles.icon} />
            Oil Management
          </a>
        </li>
        <li>
          <a href="/users" className={styles.navItem}>
            <FaUsers className={styles.icon} />
            User Management
          </a>
        </li>
        <li>
          <a href="/city" className={styles.navItem}>
            <FaCity className={styles.icon} />
            City Operation
          </a>
        </li>
        <li>
          <a href="/login" className={styles.navItem}>
            <FaSignOutAlt className={styles.icon} />
            Logout
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
