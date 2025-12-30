import React, { useState, useEffect } from "react";
import { db } from "../../../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./TankerFill.css";
import EditTanker from "./EditTanker";

export default function TankerFill({ onClose, showRecordsOnly = false }) {
  const [tankerId, setTankerId] = useState("");
  const [totalPumpOil, setTotalPumpOil] = useState("");
  const [filledOil, setFilledOil] = useState("");
  const [remainingOil, setRemainingOil] = useState("");
  const [source, setSource] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [driverName, setDriverName] = useState("");
  const [tankerOptions, setTankerOptions] = useState([]);
  const [activeTankerOptions, setActiveTankerOptions] = useState([]);
  const [records, setRecords] = useState([]);
  const [editRecord, setEditRecord] = useState(null);
  const [showOverfillPopup, setShowOverfillPopup] = useState(false);
  const [userVehicle, setUserVehicle] = useState(null); // ✅ NEW: User's assigned vehicle
  const [isLoadingUserVehicle, setIsLoadingUserVehicle] = useState(true);

  // ✅ UPDATED: Auto-select user's assigned vehicle/tanker from user management
  useEffect(() => {
    const loadUserVehicle = async () => {
      try {
        setIsLoadingUserVehicle(true);
        const stored = localStorage.getItem("loggedUser");
        if (!stored) return;

        const user = JSON.parse(stored);
        console.log("Logged user data:", user); // Debug

        // ✅ Check multiple possible vehicle fields in user data
        let userVehicleId = null;
        if (user.vehicleId) userVehicleId = user.vehicleId;
        else if (user.tankerId) userVehicleId = user.tankerId;
        else if (user.truckId) userVehicleId = user.truckId;
        else if (user.assignedVehicle) userVehicleId = user.assignedVehicle;

        if (userVehicleId) {
          console.log(`Found user vehicle: ${userVehicleId}`);
          setUserVehicle({ id: userVehicleId, truckNumber: userVehicleId });
          setTankerId(userVehicleId);
        }
      } catch (err) {
        console.error("Failed to load user vehicle:", err);
      } finally {
        setIsLoadingUserVehicle(false);
      }
    };

    loadUserVehicle();
  }, []);

  // ✅ Fleet management se trucks fetch + FILTER ACTIVE ONLY
  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const snapshot = await getDocs(collection(db, "trucks"));
        const allTrucks = snapshot.docs.map((docu) => ({
          id: docu.id,
          ...docu.data(),
        }));

        // ✅ FILTER: Only show ACTIVE vehicles
        const activeTrucks = allTrucks.filter((truck) => {
          const status = truck.status?.toLowerCase();
          const maintenanceStatus = truck.maintenanceStatus?.toLowerCase();
          const isActive = truck.isActive === true || 
                          status === 'active' || 
                          maintenanceStatus === 'active' || 
                          !truck.isMaintenance;
          return isActive;
        });

        setTankerOptions(allTrucks);
        setActiveTankerOptions(activeTrucks);

        console.log(`Found ${allTrucks.length} trucks, ${activeTrucks.length} active`);

        // ✅ AUTO-SELECT user's vehicle if available and active
        if (userVehicle && activeTrucks.length > 0) {
          const userTruck = activeTrucks.find(t => 
            t.truckNumber === userVehicle.truckNumber || 
            t.id === userVehicle.id
          );
          
          if (userTruck) {
            console.log("Auto-selecting user's vehicle:", userTruck.truckNumber);
            setTankerId(userTruck.truckNumber);
            setSource(userTruck.location || "");
            setDriverName(userTruck.driverName || "");
          }
        }
      } catch (error) {
        console.error("Error fetching trucks:", error);
      }
    };

    fetchTrucks();
  }, [userVehicle]); // ✅ Re-run when userVehicle loads

  // Records live (latest first)
  useEffect(() => {
    const q = query(
      collection(db, "tankerFillOperations"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setTotalPumpOil("");
    setFilledOil("");
    setRemainingOil("");
    setDateTime("");
    setShowOverfillPopup(false);
  };

  // Print functions (unchanged)
  const handlePrintSingleRecord = (record) => {
    const docPdf = new jsPDF("p", "mm", "a4");
    docPdf.setFontSize(20);
    docPdf.setFont("helvetica", "bold");
    docPdf.text("Tanker Fill Record", 20, 25);
    
    docPdf.setFontSize(12);
    docPdf.setFont("helvetica", "normal");
    
    const details = [
      ["Truck ID:", record.tankerId || "N/A"],
      ["Total Pump Oil:", `${record.totalPumpOil || 0} L`],
      ["Filled Oil:", `${record.filledOil || 0} L`],
      ["Remaining Oil:", `${record.remainingOil || 0} L`],
      ["Location:", record.source || "N/A"],
      ["Date & Time:", record.dateTime || "N/A"],
      ["Driver Name:", record.driverName || "N/A"],
    ];

    let yPosition = 45;
    details.forEach(([label, value]) => {
      docPdf.text(label, 20, yPosition);
      docPdf.text(value, 80, yPosition);
      yPosition += 8;
    });

    docPdf.setFillColor(52, 152, 219);
    docPdf.rect(20, yPosition + 5, 170, 15, 'F');
    docPdf.setTextColor(255);
    docPdf.setFontSize(14);
    docPdf.setFont("helvetica", "bold");
    docPdf.text("SUMMARY", 25, yPosition + 12);
    docPdf.setFontSize(10);
    docPdf.text(
      `Total: ${record.totalPumpOil || 0}L | Filled: ${record.filledOil || 0}L | Remaining: ${record.remainingOil || 0}L`,
      25,
      yPosition + 17
    );

    docPdf.save(`tanker-record-${record.tankerId || "single"}-${Date.now()}.pdf`);
  };

  const handlePrintAllRecords = () => {
    const docPdf = new jsPDF("p", "mm", "a4");
    autoTable(docPdf, {
      startY: 30,
      head: [["Truck ID", "Total Pump Oil", "Filled Oil", "Remaining Oil", "Location", "Date & Time", "Driver Name"]],
      body: records.map((r) => [
        r.tankerId || "",
        `${r.totalPumpOil || 0} L`,
        `${r.filledOil || 0} L`,
        `${r.remainingOil || 0} L`,
        r.source || "",
        r.dateTime || "",
        r.driverName || "",
      ]),
      styles: { fontSize: 10, cellPadding: 2, valign: "middle", halign: "center" },
      headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: "bold" },
      margin: { top: 30 },
    });
    docPdf.save("tanker-fill-records.pdf");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tankerId || !filledOil || !dateTime || !driverName) return;

    const currentFilled = Number(filledOil);
    const q = query(
      collection(db, "tankerFillOperations"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);

    let finalTotal = 0;
    let finalRemaining = 0;

    if (!snap.empty) {
      const last = snap.docs[0].data();
      const lastRemaining = Number(last.remainingOil || 0);
      if (lastRemaining > 0) {
        finalTotal = lastRemaining;
      } else {
        if (!totalPumpOil) {
          alert("Your tanker oil finished, please fill again (enter Total Pump Oil).");
          return;
        }
        finalTotal = Number(totalPumpOil);
      }
    } else {
      if (!totalPumpOil) {
        alert("First time ke liye Total Pump Oil enter karna zaruri hai.");
        return;
      }
      finalTotal = Number(totalPumpOil);
    }

    if (currentFilled > finalTotal) {
      setShowOverfillPopup(true);
      return;
    }

    finalRemaining = finalTotal - currentFilled;

    try {
      await addDoc(collection(db, "tankerFillOperations"), {
        tankerId,
        totalPumpOil: finalTotal,
        filledOil: currentFilled,
        remainingOil: finalRemaining,
        source,
        dateTime,
        driverName,
        createdAt: serverTimestamp(),
      });

      setRemainingOil(String(finalRemaining));
      setFilledOil("");
      setDateTime("");

      if (finalRemaining === 0) {
        alert("Your tanker oil finished, please fill again.");
        setTotalPumpOil("");
      } else {
        setTotalPumpOil(String(finalRemaining));
      }

      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Failed to save record. Please try again.");
    }
  };

  const handleCancel = () => {
    resetForm();
    if (onClose) onClose();
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "tankerFillOperations", id));
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record.");
    }
  };

  const handleEdit = (item) => setEditRecord(item);

  const handleTruckSelect = async (truckNumber) => {
    setTankerId(truckNumber);
    const selectedTruck = activeTankerOptions.find(t => t.truckNumber === truckNumber);
    if (selectedTruck) {
      setSource(selectedTruck.location || "");
      setDriverName(selectedTruck.driverName || "");
    }

    const q = query(
      collection(db, "tankerFillOperations"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const lastRecord = snapshot.docs[0].data();
      const nextTotal = Number(lastRecord.remainingOil || lastRecord.totalPumpOil || 0);
      setTotalPumpOil(nextTotal ? String(nextTotal) : "");
      setRemainingOil(String(lastRecord.remainingOil || ""));
    } else {
      setTotalPumpOil("");
      setRemainingOil("");
    }
  };

  return (
    <div className="tanker-fill">
      {editRecord ? (
        <EditTanker record={editRecord} onCancel={() => setEditRecord(null)} />
      ) : (
        <>
          {!showRecordsOnly && (
            <>
              <h3>🚚 Fill Truck From Tanker</h3>

              {/* ✅ USER VEHICLE INDICATOR */}
              {userVehicle && (
                <div className="user-vehicle-indicator">
                  👤 Auto-selected for <strong>{userVehicle.truckNumber}</strong> 
                  (Your assigned vehicle)
                </div>
              )}

              {isLoadingUserVehicle ? (
                <div className="loading-indicator">Loading your vehicle...</div>
              ) : (
                <form onSubmit={handleSubmit} className="tanker-form">
                  <label>Truck ID:</label>
                  <select
                    value={tankerId}
                    onChange={(e) => handleTruckSelect(e.target.value)}
                    required
                  >
                    <option value="">
                      {userVehicle ? `Your Vehicle: ${userVehicle.truckNumber}` : "Select Active Truck"}
                    </option>
                    {activeTankerOptions.map((truck) => (
                      <option key={truck.id} value={truck.truckNumber}>
                        {truck.truckNumber}
                      </option>
                    ))}
                  </select>

                  <label>Total Pump Oil (L):</label>
                  <input
                    type="number"
                    value={totalPumpOil}
                    onChange={(e) => setTotalPumpOil(e.target.value)}
                    placeholder="Enter only when new tanker loaded"
                    min="0"
                  />

                  <label>Filled Oil (L):</label>
                  <input
                    type="number"
                    value={filledOil}
                    onChange={(e) => setFilledOil(e.target.value)}
                    required
                    min="0"
                  />

                  <label>Remaining Oil (L):</label>
                  <input type="number" value={remainingOil} readOnly />

                  <label>Location:</label>
                  <input type="text" value={source} readOnly />

                  <label>Driver Name:</label>
                  <input type="text" value={driverName} readOnly />

                  <label>Date & Time:</label>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    required
                  />

                  <div className="form-actions">
                    <button type="submit">Add Record</button>
                    <button type="button" onClick={handleCancel}>Cancel</button>
                  </div>
                </form>
              )}

              {/* Maintenance warning */}
              {tankerOptions.length > activeTankerOptions.length && (
                <div className="maintenance-warning">
                  ℹ️ {tankerOptions.length - activeTankerOptions.length} vehicles in maintenance (hidden).
                </div>
              )}
            </>
          )}
        </>
      )}

      {showOverfillPopup && (
        <div className="overfill-popup">
          <div className="popup-content">
            <h4>⚠️ Overfilled</h4>
            <p>
              Filled oil (<strong>{filledOil}L</strong>) exceeds total capacity (<strong>{totalPumpOil}L</strong>).
            </p>
            <div className="popup-actions">
              <button onClick={() => setShowOverfillPopup(false)}>OK, I'll Fix</button>
            </div>
          </div>
        </div>
      )}

      <div className="tanker-table">
        <div className="table-header">
          <h4>🚚 Tanker Fill Records</h4>
          <button className="print-btn" onClick={handlePrintAllRecords}>
            🖨️ Print All
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Truck ID</th>
              <th>Total (L)</th>
              <th>Filled (L)</th>
              <th>Remaining (L)</th>
              <th>Location</th>
              <th>Date</th>
              <th>Driver</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item.id}>
                <td>{item.tankerId}</td>
                <td>{item.totalPumpOil}</td>
                <td>{item.filledOil}</td>
                <td>{item.remainingOil}</td>
                <td>{item.source}</td>
                <td>{item.dateTime}</td>
                <td>{item.driverName}</td>
                <td>
                  <button className="print-single-btn" onClick={() => handlePrintSingleRecord(item)} title="Print">🖨️</button>
                  <button onClick={() => handleEdit(item)} title="Edit">✏️</button>
                  <button onClick={() => handleDelete(item.id)} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
