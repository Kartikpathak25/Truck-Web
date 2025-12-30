import React, { useState, useEffect } from "react";
import { db } from "../../../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc   // ✅ ADD THIS LINE
} from "firebase/firestore";


import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./TruckFill.css";
import EditTruck from "./EditTruck";

export default function TruckFill({ onClose, showRecordsOnly = false }) {
  const [tankerId, setTankerId] = useState("");
  const [product, setProduct] = useState("");
  const [totalPumpOil, setTotalPumpOil] = useState("");
  const [oldOil, setOldOil] = useState("");
  const [filledOil, setFilledOil] = useState("");
  const [finalOil, setFinalOil] = useState("");
  const [pumpName, setPumpName] = useState("");
  const [dateReceived, setDateReceived] = useState("");
  const [driverName, setDriverName] = useState("");

  const [records, setRecords] = useState([]);
  const [editRecord, setEditRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isTankerAccess, setIsTankerAccess] = useState(false);
  const [showOverfillPopup, setShowOverfillPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState(null);

  // 🚀 STEP 1: LOGIN DATA से TANKER ID
  useEffect(() => {
    const initUser = async () => {
      try {
        setIsLoading(true);
        const user = JSON.parse(localStorage.getItem("loggedUser"));
        console.log("🔍 LOGIN DATA:", user);
        setUserData(user);

        const role = user.role?.toLowerCase() || user.assignedType?.toLowerCase();
        setIsTankerAccess(role.includes("tanker") || role === "admin" || user.assignedType === "Tanker");

        const tankerId = user.assignedTruckNumber || user.assignedId || user.LIC;
        console.log("🔍 TANKER ID:", tankerId);
        
        if (tankerId) setTankerId(tankerId);
      } catch (error) {
        console.error("User error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initUser();
  }, []);

  // 🚀 STEP 2: ULTIMATE TANKER + DRIVER SEARCH
  // 🚀 STEP 2: FETCH TANKER FROM FLEET (tankers collection)
useEffect(() => {
  if (!tankerId || isLoading) return;

  const fetchTankerFromFleet = async () => {
    try {
      console.log("🔍 FETCHING TANKER FROM FLEET:", tankerId);

      const q = query(
        collection(db, "tankers"),
        where("truckNumber", "==", tankerId)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const tanker = snapshot.docs[0].data();

        console.log("✅ TANKER FOUND:", tanker);

        // ✅ AUTO FILL FROM FLEET
        setTotalPumpOil(tanker.capacity || "");
        setOldOil(tanker.remainingOil || 0);
        setPumpName(tanker.location || "Pump Station");
        setDriverName(
          userData?.driverName ||
          tanker.driverName ||
          "Driver"
        );
      } else {
        console.warn("❌ Tanker not found in fleet");
      }
    } catch (error) {
      console.error("Fleet fetch error:", error);
    }
  };

  fetchTankerFromFleet();
}, [tankerId, isLoading, userData]);


  // 🚀 STEP 3: tankerfilloperation (pump) RECORDS
  useEffect(() => {
    if (!tankerId || isLoading) return;

    const fetchRecords = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, "tankerfilloperation (pump)"), where("tankerId", "==", tankerId))
        );
        
        const recordsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setRecords(recordsData.sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived)));
        
        if (recordsData.length > 0) {
          setOldOil(recordsData[0].finalOil || "0");
        }
      } catch (error) {
        console.error("Records error:", error);
      }
    };

    fetchRecords();
  }, [tankerId]);

  // Auto calculate final oil
  useEffect(() => {
    const old = Number(oldOil) || 0;
    const filled = Number(filledOil) || 0;
    setFinalOil((old + filled > 0) ? (old + filled).toString() : "");
  }, [oldOil, filledOil]);

  const resetForm = () => {
    setProduct(""); setFilledOil(""); setDateReceived(""); setFinalOil("");
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const capacity = Number(totalPumpOil);
  const final = Number(finalOil);

  if (final > capacity) {
    setShowOverfillPopup(true);
    return;
  }

  // 1️⃣ Save fill operation
  await addDoc(collection(db, "tankerfilloperation (pump)"), {
    tankerId,
    product,
    totalPumpOil: capacity,
    oldOil: Number(oldOil),
    filledOil: Number(filledOil),
    finalOil: final,
    pumpName,
    dateReceived,
    driverName,
    createdAt: serverTimestamp(),
  });

  // 2️⃣ Update tanker remaining oil
  const tankerQuery = query(
    collection(db, "tankers"),
    where("truckNumber", "==", tankerId)
  );

  const tankerSnap = await getDocs(tankerQuery);

  if (!tankerSnap.empty) {
    const tankerDoc = tankerSnap.docs[0];
    await updateDoc(doc(db, "tankers", tankerDoc.id), {
      remainingOil: final,
    });
  }

  alert("✅ Tanker filled & remaining oil updated");
  resetForm();
};


  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "tankerfilloperation (pump)", id));
      setRecords(records.filter(r => r.id !== id));
    } catch (error) {
      alert("❌ Delete failed");
    }
  };

  if (isLoading) {
    return <div className="loading-screen">🔄 Loading tanker details...</div>;
  }

  return (
    <div className="truck-fill">
      {!showRecordsOnly && (
        <>
          <h3>🚚 Fill Tanker from Pump</h3>

          {/* STATUS BAR */}
          <div className="role-badge tanker">
            ✅ <strong>TANKER ID:</strong> {tankerId} | 
            🚛 <strong>DRIVER:</strong> 
            <span className={driverName ? "driver-found" : "driver-loading"}>
              {driverName || "Auto-searching..."}
            </span>
          </div>

          {isTankerAccess && (
            <form onSubmit={handleSubmit} className="truck-form">
              {/* TANKER ID - LOCKED */}
              <label>Tanker ID:</label>
              <input
                type="text"
                value={tankerId}
                readOnly
                className="locked-field"
              />

              <div className="form-row-split">
                <div>
                  <label>Product:</label>
                  <input type="text" value={product} onChange={e => setProduct(e.target.value)} required />
                </div>
                <div>
                  <label>Capacity (L):</label>
                  <input type="number" value={totalPumpOil} onChange={e => setTotalPumpOil(e.target.value)} required min="0" />
                </div>
              </div>

              <div className="form-row-split">
                <div>
                  <label>Remaining  Oil (L):</label>
                  <input type="number" value={oldOil} onChange={e => setOldOil(e.target.value)} min="0" />
                </div>
                <div>
                  <label>New Fill (L):</label>
                  <input type="number" value={filledOil} onChange={e => setFilledOil(e.target.value)} required min="0" />
                </div>
              </div>

              <label className="final-oil-label">Final Oil:</label>
              <input type="number" value={finalOil} readOnly className="final-oil-field" />

              <div className="form-row-split">
                <div>
                  <label>Pump:</label>
                  <input type="text" value={pumpName} onChange={e => setPumpName(e.target.value)} required />
                </div>
                <div>
                  <label>Driver:</label>
                  <input 
                    type="text" 
                    value={driverName} 
                    readOnly 
                    className="locked-field driver-locked"
                  />
                </div>
              </div>

              <label>Date:</label>
              <input type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} required />

              <div className="form-actions">
                <button type="submit">✅ Save Record</button>
                <button type="button" onClick={() => { resetForm(); if (onClose) onClose(); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* RECORDS TABLE */}
      <div className="truck-table">
        <div className="table-header">
          <h4>📋 tankerfilloperation (pump) Records ({records.length})</h4>
          <button className="print-btn" onClick={() => {/* print */}}>🖨️ Print All</button>
        </div>
        
        {records.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Capacity</th>
                <th>Remaining Oil</th>
                <th>Filled</th>
                <th>Final Oil</th>
                <th>Pump</th>
                <th>Date</th>
                <th>Driver</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 10).map(item => (
                <tr key={item.id}>
                  <td>{item.product}</td>
                  <td>{item.totalPumpOil}L</td>
                  <td>{item.oldOil || 0}L</td>
                  <td>{item.filledOil}L</td>
                  <td className="remaining-oil">{item.finalOil}L</td>
                  <td>{item.pumpName}</td>
                  <td>{item.dateReceived}</td>
                  <td>{item.driverName}</td>
                  <td>
                    <button className="print-btn-small" onClick={() => {/* print */}}>🖨️</button>
                    {isTankerAccess && (
                      <>
                        <button className="edit-btn" onClick={() => setEditRecord(item)}>✏️</button>
                        <button className="delete-btn" onClick={() => { setDeleteRecordId(item.id); setShowDeleteConfirm(true); }}>🗑️</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No records found for {tankerId}</p>
        )}
      </div>

      {/* POPUPS */}
      {showOverfillPopup && (
        <div className="overfill-popup">
          <div className="popup-content">
            <h4>⚠️ Overfill Warning!</h4>
            <p>{finalOil}L exceeds {totalPumpOil}L capacity</p>
            <div className="popup-actions">
              <button onClick={() => setShowOverfillPopup(false)}>Fix It</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-popup">
          <div className="popup-content">
            <h4>🗑️ Confirm Delete</h4>
            <p>Delete this record permanently?</p>
            <div className="popup-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-confirm" onClick={async () => {
                await handleDelete(deleteRecordId);
                setShowDeleteConfirm(false);
              }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
