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

import autoTable from "jspdf-autotable";  // 👈 import the plugin
import "./TankerFill.css";
import EditTanker from "./EditTanker";

export default function TankerFill({ onClose, showRecordsOnly = false }) {
  const [tankerId, setTankerId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [source, setSource] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [oldReading, setOldReading] = useState("");
  const [currentReading, setCurrentReading] = useState("");
  const [driverName, setDriverName] = useState("");
  const [tankerOptions, setTankerOptions] = useState([]);
  const [records, setRecords] = useState([]);
  const [editRecord, setEditRecord] = useState(null);

  // Fetch Truck Numbers
  useEffect(() => {
    const fetchTrucks = async () => {
      const snapshot = await getDocs(collection(db, "trucks"));
      setTankerOptions(snapshot.docs.map(doc => doc.data().truckNumber));
    };
    fetchTrucks();
  }, []);

  // Fetch Tanker Fill records
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tankerFillOperations"), snap => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setTankerId("");
    setQuantity("");
    setSource("");
    setDateTime("");
    setOldReading("");
    setCurrentReading("");
    setDriverName("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!tankerId || !quantity || !source || !dateTime || !oldReading || !currentReading || !driverName) return;

    await addDoc(collection(db, "tankerFillOperations"), {
      tankerId,
      quantity,
      source,
      dateTime,
      oldReading,
      currentReading,
      driverName,
      createdAt: serverTimestamp(),
    });

    resetForm();
    if (onClose) onClose();
  };

  const handleCancel = () => {
    resetForm();
    if (onClose) onClose(); // 👈 go back to dashboard
  };

  const handleDelete = async id => await deleteDoc(doc(db, "tankerFillOperations", id));

  const handleEdit = item => setEditRecord(item);

 const handlePrint = () => {
  const doc = new jsPDF("p", "mm", "a4"); // portrait, millimeters, A4 size
  // const pageWidth = doc.internal.pageSize.getWidth();

  

  // Table below title
  autoTable(doc, {
    startY: 30, // 👈 ensures table starts below title
    head: [["Truck Number", "Quantity", "Location", "Date & Time", "Old Reading", "Current Reading", "Driver Name"]],
    body: records.map(r => [
      r.tankerId || "",
      r.quantity || "",
      r.source || "",
      r.dateTime || "",
      r.oldReading || "",
      r.currentReading || "",
      r.driverName || "",
    ]),
    styles: {
      fontSize: 10,
      cellPadding: 2,
      valign: "middle",
      halign: "center",
    },
    headStyles: {
      fillColor: [52, 152, 219],
      textColor: 255,
      fontStyle: "bold",
    },
    margin: { top: 30 },
  });

  doc.save("tanker-fill-records.pdf");
};



  return (
    <div className="tanker-fill">
      {editRecord ? (
        <EditTanker record={editRecord} onCancel={() => setEditRecord(null)} />
      ) : (
        !showRecordsOnly && (
          <>
            <h3>🚚 Fill Truck From: Tanker To Truck</h3>
            <form onSubmit={handleSubmit} className="tanker-form">
              <label>Truck Number:</label>
              <select value={tankerId} onChange={e => setTankerId(e.target.value)} required>
                <option value="">Select Truck</option>
                {tankerOptions.map((truckNumber, index) => (
                  <option key={index} value={truckNumber}>{truckNumber}</option>
                ))}
              </select>

              <label>Quantity (L):</label>
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required />

              <label>Location:</label>
              <input type="text" value={source} onChange={e => setSource(e.target.value)} required />

              <label>Date & Time:</label>
              <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} required />

              <label>Old Reading (KM):</label>
              <input type="number" value={oldReading} onChange={e => setOldReading(e.target.value)} required />

              <label>Current Reading (KM):</label>
              <input type="number" value={currentReading} onChange={e => setCurrentReading(e.target.value)} required />

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

      <div className="tanker-table">
        <div className="table-header">
          <h4>🚚 Tanker Fill Records</h4>
          <button className="print-btn" onClick={handlePrint}>🖨️ Print</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Truck Number</th>
              <th>Quantity</th>
              <th>Location</th>
              <th>Date & Time</th>
              <th>Old Reading</th>
              <th>Current Reading</th>
              <th>Driver Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map(item => (
              <tr key={item.id}>
                <td>{item.tankerId}</td>
                <td>{item.quantity}</td>
                <td>{item.source}</td>
                <td>{item.dateTime}</td>
                <td>{item.oldReading}</td>
                <td>{item.currentReading}</td>
                <td>{item.driverName}</td>
                <td>
                  <button onClick={() => handleEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
