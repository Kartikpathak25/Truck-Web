// src/Pages/Modules/Oilmanagement/operation/TankerFill/EditTanker.jsx
import React, { useState } from "react";
import { db } from "../../../../../firebase";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import "./TankerFill.css";

export default function EditTanker({ record, onCancel }) {
  const [quantity, setQuantity] = useState(record.quantity);
  const [source, setSource] = useState(record.source);
  const [dateTime, setDateTime] = useState(record.dateTime);
  const [oldReading, setOldReading] = useState(record.oldReading);
  const [currentReading, setCurrentReading] = useState(record.currentReading);
  const [driverName, setDriverName] = useState(record.driverName);

  const handleUpdate = async e => {
    e.preventDefault();
    await updateDoc(doc(db, "tankerFillOperations", record.id), {
      quantity,
      source,
      dateTime,
      oldReading,
      currentReading,
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
        <input type="number" value={oldReading} onChange={e => setOldReading(e.target.value)} required />

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
