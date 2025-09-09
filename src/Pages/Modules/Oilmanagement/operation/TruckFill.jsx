// src/pages/Dashboard/Oilmanagement/operation/TruckFill.js
import React, { useState, useEffect } from "react";
import { db } from "../../../../firebase";
import { collection, addDoc, onSnapshot, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import "./TruckFill.css";

export default function TruckFill({ onClose, showRecordsOnly = false }) {
  const [form, setForm] = useState({
    tankerId: "",
    product: "",
    quantity: "",
    pumpName: "",
    dateReceived: "",
    driverName: "",
    fuelRemaining: "",
  });
  const [records, setRecords] = useState([]);

  // Fetch Truck Fill records
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "truckFillOperations"), snap => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.tankerId || !form.product || !form.quantity || !form.pumpName || !form.dateReceived || !form.driverName || !form.fuelRemaining) return;

    await addDoc(collection(db, "truckFillOperations"), {
      ...form,
      createdAt: serverTimestamp(),
    });

    // Reset form
    setForm({
      tankerId: "",
      product: "",
      quantity: "",
      pumpName: "",
      dateReceived: "",
      driverName: "",
      fuelRemaining: "",
    });

    if (onClose) onClose();
  };

  const handleDelete = async id => await deleteDoc(doc(db, "truckFillOperations", id));

  return (
    <div className="truck-fill">
      {/* Render Form only if NOT showRecordsOnly */}
      {!showRecordsOnly && (
        <>
          <h3>🛢️ Truck Fill Tanker</h3>
          <form onSubmit={handleSubmit} className="truck-form">
            <input type="text" name="tankerId" placeholder="Tanker ID" value={form.tankerId} onChange={handleChange} required />
            <input type="text" name="product" placeholder="Product" value={form.product} onChange={handleChange} required />
            <input type="number" name="quantity" placeholder="Quantity (L)" value={form.quantity} onChange={handleChange} required />
            <input type="text" name="pumpName" placeholder="Pump Name" value={form.pumpName} onChange={handleChange} required />
            <input type="date" name="dateReceived" value={form.dateReceived} onChange={handleChange} required />
            <input type="text" name="driverName" placeholder="Driver Name" value={form.driverName} onChange={handleChange} required />
            <input type="number" name="fuelRemaining" placeholder="Fuel Remaining (L)" value={form.fuelRemaining} onChange={handleChange} required />
            <div className="form-actions">
              <button type="submit">Add</button>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </>
      )}

      {/* Records Table (always visible) */}
      <div className="truck-table">
        <h4>🛢️ Truck Fill Records</h4>
        <table>
          <thead>
            <tr>
              <th>Tanker ID</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Pump Name</th>
              <th>Date</th>
              <th>Driver</th>
              <th>Fuel Remaining</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map(item => (
              <tr key={item.id}>
                <td>{item.tankerId}</td>
                <td>{item.product}</td>
                <td>{item.quantity}</td>
                <td>{item.pumpName}</td>
                <td>{item.dateReceived}</td>
                <td>{item.driverName}</td>
                <td>{item.fuelRemaining}</td>
                <td><button onClick={() => handleDelete(item.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
