// src/Pages/Modules/Oilmanagement/operation/TankerFill/EditTanker.jsx
import React, { useState, useEffect } from "react";
import { db } from "../../../../../firebase";
import { updateDoc, doc, serverTimestamp, getDocs, collection, query, where, orderBy, limit } from "firebase/firestore";
import "./TankerFill.css";

export default function EditTanker({ record, onCancel }) {
  const [quantity, setQuantity] = useState(record.quantity);
  const [source, setSource] = useState(record.source);
  const [dateTime, setDateTime] = useState(record.dateTime);
  const [oldReading, setOldReading] = useState(record.oldReading);
  const [currentReading, setCurrentReading] = useState(record.currentReading);
  const [driverName, setDriverName] = useState(record.driverName);

  // ✅ Auto‑fetch truck details (location + driverName) from trucks collection
  useEffect(() => {
    const fetchTruckDetails = async () => {
      const snapshot = await getDocs(collection(db, "trucks"));
      const truck = snapshot.docs.map(d => d.data()).find(t => t.truckNumber === record.tankerId);
      if (truck) {
        setSource(truck.location || source);
        setDriverName(truck.driverName || driverName);
      }
    };
    fetchTruckDetails();
  }, [record.tankerId]);

  // ✅ Auto‑fetch last currentReading for continuity
  useEffect(() => {
    const fetchLastReading = async () => {
      const q = query(
        collection(db, "tankerFillOperations"),
        where("tankerId", "==", record.tankerId),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const lastRecord = snapshot.docs[0].data();
        setOldReading(Number(lastRecord.currentReading) || oldReading);
      }
    };
    fetchLastReading();
  }, [record.tankerId]);

  const handleUpdate = async e => {
    e.preventDefault();
    await updateDoc(doc(db, "tankerFillOperations", record.id), {
      quantity: Number(quantity),
      source,
      dateTime,
      oldReading: Number(oldReading),
      currentReading: Number(currentReading),
      driverName,
      updatedAt: serverTimestamp(),
    });
    onCancel(); // close edit form after update
  };

  return (
    <div className="tanker-edit-form">
      <h3>✏️ Edit Tanker Fill Record</h3>
      <form onSubmit={handleUpdate} className="tanker-form">
        <label>Truck Number:</label>
        <input type="text" value={record.tankerId} disabled />

        <label>Quantity (L):</label>
        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required />

        <label>Location:</label>
        <input type="text" value={source} onChange={e => setSource(e.target.value)} required />

        <label>Date & Time:</label>
        <input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} required />

        <label>Old Reading (KM):</label>
        <input type="number" value={oldReading} onChange={e => setOldReading(e.target.value)} required disabled />

        <label>Current Reading (KM):</label>
        <input type="number" value={currentReading} onChange={e => setCurrentReading(e.target.value)} required />

        <label>Driver Name:</label>
        <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} required />

        <div className="form-actions">
          <button type="submit">Update</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
