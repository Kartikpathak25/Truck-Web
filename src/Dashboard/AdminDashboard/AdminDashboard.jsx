// src/Dashboard/AdminDashboard/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  FaTruck,
  FaGasPump,
  FaClipboardList,
  FaTachometerAlt,
} from "react-icons/fa";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase"; 
import "./AdminDashboard.css";
import Sidebar from "../../Component/Sidebar/Sidebar";

const AdminDashboard = () => {
  const [totalTrucks, setTotalTrucks] = useState(0);
  const [activeTrucks, setActiveTrucks] = useState(0);
  const [inMaintenance, setInMaintenance] = useState(0);
  const [oilFilledToday, setOilFilledToday] = useState(0);
  const [pendingDeliveries, setPendingDeliveries] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🚚 Trucks data
        const trucksRef = collection(db, "trucks");
        const allSnap = await getDocs(trucksRef);
        setTotalTrucks(allSnap.size);

        const activeSnap = await getDocs(
          query(trucksRef, where("status", "==", "Active"))
        );
        setActiveTrucks(activeSnap.size);

        const maintenanceSnap = await getDocs(
          query(trucksRef, where("status", "==", "Maintenance"))
        );
        setInMaintenance(maintenanceSnap.size);

        // 🛢️ Tanker Fill Operations → Oil Filled Today
        const tankerRef = collection(db, "tankerFillOperations");
        const tankerSnap = await getDocs(tankerRef);

        let todayOil = 0;
        const today = new Date().toISOString().split("T")[0]; // "2025-09-08"

        tankerSnap.docs.forEach((doc) => {
          const data = doc.data();
          const dateStr = data.dateTime?.split("T")[0]; // "2025-09-08"
          if (dateStr === today) {
            todayOil += parseInt(data.quantity || "0", 10);
          }
        });
        setOilFilledToday(todayOil);

        // 🚚 Truck Fill Operations → Pending Deliveries
        const truckFillRef = collection(db, "truckFillOperations");
        const truckFillSnap = await getDocs(truckFillRef);

        setPendingDeliveries(truckFillSnap.size);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <h1>Dashboard Overview</h1>
        <div className="cards">
          <div className="card trucks">
            <div className="card-icon"><FaTruck /></div>
            <h3>Total Trucks</h3>
            <p>{totalTrucks}</p>
          </div>

          <div className="card tankers">
            <div className="card-icon"><FaTachometerAlt /></div>
            <h3>Active Trucks</h3>
            <p>{activeTrucks}</p>
          </div>

          <div className="card oil">
            <div className="card-icon"><FaGasPump /></div>
            <h3>Oil Filled Today</h3>
            <p>{oilFilledToday} L</p>
          </div>

          <div className="card pending">
            <div className="card-icon"><FaClipboardList /></div>
            <h3>Pending Deliveries</h3>
            <p>{pendingDeliveries}</p>
          </div>
        </div>

        <div className="status">
          <h3>Fleet Status</h3>
          <ul>
            <li>Active Vehicles: {activeTrucks}/{totalTrucks}</li>
            <li>In Maintenance: {inMaintenance}/{totalTrucks}</li>
            <li>GPS Online: 17/20 {/* later you can make this dynamic */}</li>
          </ul>
        </div>

        <div className="operations">
          <h3>Today's Operations</h3>
          <ul>
            <li>Completed Fills: 24 {/* make dynamic later */}</li>
            <li>In Progress: 3</li>
            <li>Scheduled: 8</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
