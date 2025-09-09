// src/pages/Dashboard/Oilmanagement/operation/TankerFill.js
import React, { useState, useEffect } from "react";
import { db } from "../../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import "./TankerFill.css";

export default function TankerFill({ onClose, showRecordsOnly = false }) {
  const [tankerId, setTankerId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [source, setSource] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [tankerOptions, setTankerOptions] = useState([]);
  const [records, setRecords] = useState([]);

  // Fetch Truck Numbers from 'trucks' collection
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

  const handleSubmit = async e => {
    e.preventDefault();
    if (!tankerId || !quantity || !source || !dateTime) return;

    await addDoc(collection(db, "tankerFillOperations"), {
      tankerId,
      quantity,
      source,
      dateTime,
      createdAt: serverTimestamp(),
    });

    // Reset form
    setTankerId(""); setQuantity(""); setSource(""); setDateTime("");
    if (onClose) onClose();
  };

  const handleDelete = async id => await deleteDoc(doc(db, "tankerFillOperations", id));

  return (
    <div className="tanker-fill">
      {/* Render Form only if NOT showRecordsOnly */}
      {!showRecordsOnly && (
        <>
          <h3>🚚 Tanker Fill Truck</h3>
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

            <label>Source:</label>
            <input type="text" value={source} onChange={e => setSource(e.target.value)} required />

            <label>Date & Time:</label>
            <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} required />

            <div className="form-actions">
              <button type="submit">Add</button>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </>
      )}

      {/* Records Table (always visible) */}
      <div className="tanker-table">
        <h4>🚚 Tanker Fill Records</h4>
        <table>
          <thead>
            <tr>
              <th>Truck Number</th>
              <th>Quantity</th>
              <th>Source</th>
              <th>Date & Time</th>
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
                <td>
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
