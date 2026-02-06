// src/Dashboard/Tankerdashboard/TankerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Truck, Fuel, Wrench, Activity, Search, Filter } from 'lucide-react';
import Sidebar2 from '../../Component/Sidebar/Sidebar2/Sidebar2';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './TankerDashboard.css';

const TankerDashboard = () => {
  const auth = getAuth();
  const location = useLocation();
  const isDashboardHome = location.pathname === '/tanker-dashboard';

  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    oilFilledToday: 0,
    maintenanceVehicles: 0,
  });

  const [recentOperations, setRecentOperations] = useState([]);
  const [filteredOperations, setFilteredOperations] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  // Check permissions
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedUser"));
    if (user) {
      const role = (user.role || "").toLowerCase();
      setCanEdit(role === "admin");
    }
  }, []);

  // Real-time stats fetching
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedUser"));
    const tankerId = user?.assignedTruckNumber || user?.tankerId || "";
    const userId = user?.uid || "";

    // Real-time listener for trucks
    const unsubscribeTrucks = onSnapshot(collection(db, "trucks"), (snapshot) => {
      const totalVehicles = snapshot.size;
      const activeVehicles = snapshot.docs.filter(
        doc => doc.data().status?.toLowerCase() === "active"
      ).length;

      setStats(prev => ({
        ...prev,
        totalVehicles,
        activeVehicles,
      }));
    }, (error) => {
      console.error("Error fetching trucks:", error);
    });

    // Real-time listener for tanker fill operations (oil filled today)
    let unsubscribeTankerOps = null;
    if (tankerId) {
      const tankerOpsQuery = query(
        collection(db, "tankerFillOperations"),
        where("tankerId", "==", tankerId)
      );

      unsubscribeTankerOps = onSnapshot(tankerOpsQuery, (snapshot) => {
        const today = new Date().toISOString().split('T')[0];
        let oilFilledToday = 0;

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const opDate = data.dateTime?.split('T')[0];
          if (opDate === today) {
            oilFilledToday += Number(data.filledOil || 0);
          }
        });

        setStats(prev => ({
          ...prev,
          oilFilledToday,
        }));
      }, (error) => {
        console.error("Error fetching tanker operations:", error);
      });
    }

    // Real-time listener for maintenance
    const maintenanceQuery = query(
      collection(db, "maintenance"),
      where("userId", "==", userId)
    );

    const unsubscribeMaintenance = onSnapshot(maintenanceQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        maintenanceVehicles: snapshot.size,
      }));
    }, (error) => {
      console.error("Error fetching maintenance:", error);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeTrucks();
      if (unsubscribeTankerOps) unsubscribeTankerOps();
      unsubscribeMaintenance();
    };
  }, []);

  // Real-time operations fetching
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedUser"));
    const tankerId = user?.assignedTruckNumber || user?.tankerId || "";

    if (!tankerId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener for truck fill operations
    const truckFillQuery = query(
      collection(db, "tankerFillOperations"),
      where("tankerId", "==", tankerId)
    );

    const unsubscribeTruckFill = onSnapshot(truckFillQuery, (snapshot) => {
      const truckOperations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          collection: "tankerFillOperations",
          type: "Truck Fill",
          vehicleId: data.truckId || "-",
          tankerId: data.tankerId || "-",
          driver: data.driverName || "-",
          location: data.source || "-",
          filled: data.filledOil || 0,
          dateTime: data.dateTime || "-",
          userId: data.userId || "",
        };
      });

      // Get pump operations and combine
      updateOperations(truckOperations, 'truck');
    }, (error) => {
      console.error("Error fetching truck operations:", error);
      setLoading(false);
    });

    // Real-time listener for pump fill operations
    const pumpFillQuery = query(
      collection(db, "tankerFillOperationsPump"),
      where("tankerId", "==", tankerId)
    );

    const unsubscribePumpFill = onSnapshot(pumpFillQuery, (snapshot) => {
      const pumpOperations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          collection: "tankerFillOperationsPump",
          type: "Pump Fill",
          vehicleId: "-",
          tankerId: data.tankerId || "-",
          driver: data.driverName || "-",
          location: data.pumpName || "-",
          filled: data.filledOil || 0,
          dateTime: data.dateReceived || "-",
          userId: data.userId || "",
        };
      });

      // Get truck operations and combine
      updateOperations(pumpOperations, 'pump');
    }, (error) => {
      console.error("Error fetching pump operations:", error);
      setLoading(false);
    });

    // Store operations temporarily to combine them
    let tempTruckOps = [];
    let tempPumpOps = [];

    const updateOperations = (ops, type) => {
      if (type === 'truck') {
        tempTruckOps = ops;
      } else {
        tempPumpOps = ops;
      }

      const combined = [...tempTruckOps, ...tempPumpOps];
      combined.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

      setRecentOperations(combined);
      setFilteredOperations(combined);
      setLoading(false);
    };

    // Cleanup listeners on unmount
    return () => {
      unsubscribeTruckFill();
      unsubscribePumpFill();
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...recentOperations];

    if (filterType !== 'all') {
      filtered = filtered.filter(op => op.type === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(op =>
        op.vehicleId.toLowerCase().includes(term) ||
        op.tankerId.toLowerCase().includes(term) ||
        op.driver.toLowerCase().includes(term) ||
        op.location.toLowerCase().includes(term)
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(op => {
        const opDate = op.dateTime.split('T')[0];
        return opDate === dateFilter;
      });
    }

    setFilteredOperations(filtered);
  }, [filterType, searchTerm, dateFilter, recentOperations]);

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      await deleteDoc(doc(db, deleteItem.collection, deleteItem.id));
      // No need to manually update state - real-time listener will handle it
      alert("✅ Record deleted successfully!");
      setShowDeleteConfirm(false);
      setDeleteItem(null);
    } catch (error) {
      console.error("Delete error:", error);
      alert("❌ Failed to delete record.");
    }
  };

  return (
    <div className="tanker-dashboard">
      <Sidebar2 />
      <div className="dashboard-content">
        {isDashboardHome ? (
          <>
            <div className="dashboard-header">
              <h1>Dashboard Overview</h1>
              <p>Monitor tanker activity & fuel operations</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card blue">
                <div>
                  <p>Total Vehicles</p>
                  <h2>{stats.totalVehicles}</h2>
                </div>
                <Truck />
              </div>
              <div className="stat-card green">
                <div>
                  <p>Active Vehicles</p>
                  <h2>{stats.activeVehicles}</h2>
                </div>
                <Activity />
              </div>
              <div className="stat-card orange">
                <div>
                  <p>Oil Filled Today</p>
                  <h2>{stats.oilFilledToday} L</h2>
                </div>
                <Fuel />
              </div>
              <div className="stat-card purple">
                <div>
                  <p>Maintenance</p>
                  <h2>{stats.maintenanceVehicles}</h2>
                </div>
                <Wrench />
              </div>
            </div>

            <div className="filter-bar">
              <div className="filter-item">
                <Filter />
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">All Operations</option>
                  <option value="Truck Fill">Truck Fill</option>
                  <option value="Pump Fill">Pump Fill</option>
                </select>
              </div>
              <div className="filter-item search">
                <Search />
                <input
                  type="text"
                  placeholder="Search by Vehicle / Driver"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <input
                type="date"
                className="date-filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="table-card">
              <h3>Recent Operations</h3>
              {loading ? (
                <div className="loading-state">Loading...</div>
              ) : filteredOperations.length === 0 ? (
                <div className="empty-state">No operations found</div>
              ) : (
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOperations.map((op) => (
                      <tr key={op.id}>
                        <td>
                          <span className={`type-badge ${op.type === 'Truck Fill' ? 'badge-truck' : 'badge-pump'}`}>
                            {op.type}
                          </span>
                        </td>
                        <td>{op.vehicleId}</td>
                        <td>{op.tankerId}</td>
                        <td>{op.driver}</td>
                        <td>{op.location}</td>
                        <td className="highlight">{op.filled}</td>
                        <td>{op.dateTime}</td>
                        <td>
                          <div className="action-buttons-group">
                            {(canEdit || (op.userId === auth.currentUser?.uid)) && (
                              <button
                                className="delete-btn-small"
                                onClick={() => {
                                  setDeleteItem(op);
                                  setShowDeleteConfirm(true);
                                }}
                                title="Delete record"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <Outlet />
        )}

        {showDeleteConfirm && (
          <div className="delete-confirm-popup">
            <div className="popup-content">
              <h4>🗑️ Confirm Delete</h4>
              <p>Are you sure you want to delete this record permanently?</p>
              <div className="popup-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteItem(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-confirm"
                  onClick={handleDelete}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TankerDashboard;