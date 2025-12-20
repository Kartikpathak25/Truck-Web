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
} from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./TruckFill.css";
import EditTruck from "./EditTruck";

export default function TruckFill({ onClose, showRecordsOnly = false }) {
  const [tankerId, setTankerId] = useState("");
  const [product, setProduct] = useState("");
  const [totalPumpOil, setTotalPumpOil] = useState("");   // ✅ new field
  const [filledOil, setFilledOil] = useState("");         // ✅ new field
  const [remainingOil, setRemainingOil] = useState("");   // ✅ auto-calculated
  const [pumpName, setPumpName] = useState("");
  const [dateReceived, setDateReceived] = useState("");
  const [driverName, setDriverName] = useState("");
  const [truckOptions, setTruckOptions] = useState([]);
  const [records, setRecords] = useState([]);
  const [editRecord, setEditRecord] = useState(null);

  // ✅ Fetch Truck Data
  useEffect(() => {
    const fetchTrucks = async () => {
      const snapshot = await getDocs(collection(db, "trucks"));
      setTruckOptions(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    };
    fetchTrucks();
  }, []);

  // ✅ Realtime Truck Fill records
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "truckFillOperations"), snap => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ✅ Auto-calculate remainingOil when filledOil changes
  useEffect(() => {
    if (totalPumpOil && filledOil) {
      const total = Number(totalPumpOil);
      const filled = Number(filledOil);
      const remaining = total - filled;
      setRemainingOil(remaining);
    }
  }, [totalPumpOil, filledOil]);

  const resetForm = () => {
    setTankerId("");
    setProduct("");
    setTotalPumpOil("");
    setFilledOil("");
    setRemainingOil("");
    setPumpName("");
    setDateReceived("");
    setDriverName("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!tankerId || !product || !totalPumpOil || !filledOil || !pumpName || !dateReceived || !driverName) return;

    await addDoc(collection(db, "truckFillOperations"), {
      tankerId,
      product,
      totalPumpOil: Number(totalPumpOil),
      filledOil: Number(filledOil),
      remainingOil: Number(remainingOil),
      pumpName,
      dateReceived,
      driverName,
      createdAt: serverTimestamp(),
    });

    resetForm();
    if (onClose) onClose();
  };

  const handleCancel = () => {
    resetForm();
    if (onClose) onClose();
  };

  const handleDelete = async id => await deleteDoc(doc(db, "truckFillOperations", id));

  const handleEdit = item => setEditRecord(item);

  // ✅ Print all records
  const handlePrintAll = () => {
    const doc = new jsPDF("p", "mm", "a4");
    autoTable(doc, {
      startY: 25,
      head: [["Tanker ID", "Product", "Total Pump Oil", "Filled Oil", "Remaining Oil", "Pump Name", "Date Received", "Driver Name"]],
      body: records.map(r => [
        r.tankerId || "",
        r.product || "",
        r.totalPumpOil || "",
        r.filledOil || "",
        r.remainingOil || "",
        r.pumpName || "",
        r.dateReceived || "",
        r.driverName || "",
      ]),
      styles: { fontSize: 10, halign: "center", valign: "middle" },
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
    });
    doc.save("truck-fill-records.pdf");
  };

  // ✅ Print single truck’s records
  const handlePrintSingle = (truckId) => {
    const doc = new jsPDF("p", "mm", "a4");
    autoTable(doc, {
      startY: 25,
      head: [["Tanker ID", "Product", "Total Pump Oil", "Filled Oil", "Remaining Oil", "Pump Name", "Date Received", "Driver Name"]],
      body: records
        .filter(r => r.tankerId === truckId)
        .map(r => [
          r.tankerId || "",
          r.product || "",
          r.totalPumpOil || "",
          r.filledOil || "",
          r.remainingOil || "",
          r.pumpName || "",
          r.dateReceived || "",
          r.driverName || "",
        ]),
      styles: { fontSize: 10, halign: "center", valign: "middle" },
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
    });
    doc.save(`${truckId}-truck-fill.pdf`);
  };

  // ✅ When truck selected, auto-fill driverName + location
  const handleTruckSelect = (truckNumber) => {
    setTankerId(truckNumber);
    const selectedTruck = truckOptions.find(t => t.truckNumber === truckNumber);
    if (selectedTruck) {
      setDriverName(selectedTruck.driverName || "");
      setPumpName(selectedTruck.location || "");
    }
  };

  return (
    <div className="truck-fill">
      {editRecord ? (
        <EditTruck record={editRecord} onCancel={() => setEditRecord(null)} />
      ) : (
        !showRecordsOnly && (
          <>
            <h3>🚚 Fill Tanker</h3>
            <form onSubmit={handleSubmit} className="truck-form">
              <label>Tanker ID:</label>
              <select value={tankerId} onChange={e => handleTruckSelect(e.target.value)} required>
                <option value="">Select Tanker</option>
                {truckOptions.map((truck, index) => (
                  <option key={index} value={truck.truckNumber}>{truck.truckNumber}</option>
                ))}
              </select>

              <label>Product:</label>
              <input type="text" value={product} onChange={e => setProduct(e.target.value)} required />

              <label>Total Pump Oil (L):</label>
              <input type="number" value={totalPumpOil} onChange={e => setTotalPumpOil(e.target.value)} required />

              <label>Filled Oil (L):</label>
              <input type="number" value={filledOil} onChange={e => setFilledOil(e.target.value)} required />

              <label>Remaining Oil (L):</label>
              <input type="number" value={remainingOil} readOnly />

              <label>Pump Name:</label>
              <input type="text" value={pumpName} onChange={e => setPumpName(e.target.value)} required />

              <label>Date Received:</label>
              <input type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} required />

              <label>Driver Name:</label>
              <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} required />

              <div className="form-actions">
                <button type="submit">Add</button>
                <button type="button" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          </>
        )
      )}

           <div className="truck-table">
        <div className="table-header">
          <h4>🚚 Tanker Filled Records from petrol pump </h4>
          <button className="print-btn" onClick={handlePrintAll}>🖨️ Print All</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tanker ID</th>
              <th>Product</th>
              <th>Total Pump Oil</th>
              <th>Filled Oil</th>
              <th>Remaining Oil</th>
              <th>Pump Name</th>
              <th>Date Received</th>
              <th>Driver Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map(item => (
              <tr key={item.id}>
                <td>{item.tankerId}</td>
                <td>{item.product}</td>
                <td>{item.totalPumpOil}</td>
                <td>{item.filledOil}</td>
                <td>{item.remainingOil}</td>
                <td>{item.pumpName}</td>
                <td>{item.dateReceived}</td>
                <td>{item.driverName}</td>
                <td>
                  <button onClick={() => handleEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                  <button onClick={() => handlePrintSingle(item.tankerId)}>🖨️ Print</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>  
  );
}
