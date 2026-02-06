// src/Dashboard/AdminDashboard/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FaTruck,
  FaGasPump,
  FaClipboardList,
  FaTachometerAlt,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase";
import "./AdminDashboard.css";
import Sidebar from "../../Component/Sidebar/Sidebar";

const AdminDashboard = () => {
  const [totalTrucks, setTotalTrucks] = useState(0);
  const [activeTrucks, setActiveTrucks] = useState(0);
  const [inMaintenance, setInMaintenance] = useState(0);
  const [oilFilledToday, setOilFilledToday] = useState(0);
  const [maintenanceVehicles, setMaintenanceVehicles] = useState(0);

  // 🔍 filter states
  const [searchText, setSearchText] = useState("");
  const [filterField, setFilterField] = useState("vehicleId");
  const [operations, setOperations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayISO = useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);

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
        setMaintenanceVehicles(maintenanceSnap.size); // card ke liye

        // 🛢️ Tanker Fill Operations → Oil Filled Today (sum filledOil for today)
        const tankerRef = collection(db, "tankerFillOperations");
        const tankerSnap = await getDocs(tankerRef);

        let todayOil = 0;
        tankerSnap.docs.forEach((d) => {
          const data = d.data();
          if (!data.dateTime) return;
          const dStr = String(data.dateTime).split("T")[0];
          if (dStr === todayISO) {
            todayOil += Number(data.filledOil || 0);
          }
        });
        setOilFilledToday(todayOil);

        // 📋 Load latest operations from multiple services
        const pumpRef = collection(db, "tankerFillOperationsPump"); // tanker filled from pump
        const truckFillRef = collection(db, "tankerFillOperations"); // truck filled from tanker

        const [pumpSnap, truckFillSnap] = await Promise.all([
          getDocs(query(pumpRef, orderBy("createdAt", "desc"), limit(20))),
          getDocs(query(truckFillRef, orderBy("createdAt", "desc"), limit(20))),
        ]);

        const pumpOps = pumpSnap.docs.map((d) => ({
          id: d.id,
          type: "Tanker Fill",
          tankerId: d.data().tankerId || "",
          vehicleId: "-", // pump side me sirf tanker hota hai
          driverName: d.data().driverName || "",
          city: d.data().pumpName || "",
          dateTime: d.data().dateReceived || "",
          quantity: d.data().filledOil || 0,
        }));

        const truckOps = truckFillSnap.docs.map((d) => ({
          id: d.id,
          type: "Vehicle Fill",
          tankerId: d.data().tankerId || "",
          vehicleId: d.data().vehicleId || d.data().truckId || "",
          driverName: d.data().driverName || "",
          city: d.data().source || "",
          dateTime: d.data().dateTime || "",
          quantity: d.data().filledOil || 0,
        }));

        const merged = [...pumpOps, ...truckOps]
          .sort(
            (a, b) => new Date(b.dateTime || 0) - new Date(a.dateTime || 0)
          )
          .slice(0, 20);

        setOperations(merged);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [todayISO]);

  // 🔍 filter logic (client side)
  const filteredOperations = useMemo(() => {
    if (!searchText.trim()) return operations;

    const term = searchText.toLowerCase();
    return operations.filter((op) => {
      if (filterField === "vehicleId") {
        return String(op.vehicleId).toLowerCase().includes(term);
      }
      if (filterField === "tankerId") {
        return String(op.tankerId).toLowerCase().includes(term);
      }
      if (filterField === "driverName") {
        return String(op.driverName).toLowerCase().includes(term);
      }
      if (filterField === "city") {
        return String(op.city).toLowerCase().includes(term);
      }
      return false;
    });
  }, [operations, filterField, searchText]);

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <h1>Dashboard Overview</h1>

        {/* KPI CARDS */}
        <div className="cards">
          <div className="card trucks">
            <div className="card-icon">
              <FaTruck />
            </div>
            <h3>Total Vehicle</h3>
            <p>{totalTrucks}</p>
          </div>

          <div className="card tankers">
            <div className="card-icon">
              <FaTachometerAlt />
            </div>
            <h3>Active Vehicle</h3>
            <p>{activeTrucks}</p>
          </div>

          <div className="card oil">
            <div className="card-icon">
              <FaGasPump />
            </div>
            <h3>Oil Filled Today</h3>
            <p>{oilFilledToday} L</p>
          </div>

          <div className="card pending">
            <div className="card-icon">
              <FaClipboardList />
            </div>
            <h3>Maintenance Vehicle</h3>
            <p>{maintenanceVehicles}</p>
          </div>
        </div>

        {/* 🔍 FILTER + SEARCH BAR (same line) */}
        <div className="filter-search-row">
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              value={filterField}
              onChange={(e) => setFilterField(e.target.value)}
            >
              <option value="vehicleId">Vehicle ID</option>
              <option value="tankerId">Tanker ID</option>
              <option value="driverName">Driver Name</option>
              <option value="city">City</option>
            </select>
          </div>

          <div className="search-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder={`Search by ${filterField === "vehicleId"
                  ? "Vehicle ID"
                  : filterField === "tankerId"
                    ? "Tanker ID"
                    : filterField === "driverName"
                      ? "Driver Name"
                      : "City"
                }`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        {/* 📋 RECENT OPERATIONS TABLE */}
        <div className="operations-table">
          <div className="table-header-row">
            <h3>Recent Operations</h3>
            {isLoading && <span className="small-badge">Loading...</span>}
          </div>

          {filteredOperations.length === 0 && !isLoading ? (
            <p className="empty-text">No operations found for selected filter.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Vehicle ID</th>
                  <th>Tanker ID</th>
                  <th>Driver</th>
                  <th>City / Location</th>
                  <th>Filled (L)</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredOperations.map((op) => (
                  <tr key={op.id}>
                    <td>{op.type}</td>
                    <td>{op.vehicleId || "-"}</td>
                    <td>{op.tankerId || "-"}</td>
                    <td>{op.driverName || "-"}</td>
                    <td>{op.city || "-"}</td>
                    <td>{op.quantity || 0}</td>
                    <td>{op.dateTime || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
