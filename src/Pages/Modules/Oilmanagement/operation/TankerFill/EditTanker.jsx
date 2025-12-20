// src/Pages/Modules/Oilmanagement/operation/TankerFill/EditTanker.jsx
import React, { useState, useEffect } from "react";
import { db } from "../../../../../firebase";
import {
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  collection,
} from "firebase/firestore";
import "./TankerFill.css";

export default function EditTanker({ record, onCancel }) {
  const [totalPumpOil, setTotalPumpOil] = useState(record.totalPumpOil || "");
  const [filledOil, setFilledOil] = useState(record.filledOil || "");
  const [remainingOil, setRemainingOil] = useState(record.remainingOil || "");
  const [source, setSource] = useState(record.source || "");
  const [dateTime, setDateTime] = useState(record.dateTime || "");
  const [driverName, setDriverName] = useState(record.driverName || "");

  // ✅ Auto‑fetch truck details (location + driverName) from trucks collection
  useEffect(() => {
    const fetchTruckDetails = async () => {
      const snapshot = await getDocs(collection(db, "trucks"));
      const truck = snapshot.docs
        .map((d) => d.data())
        .find((t) => t.truckNumber === record.tankerId);
      if (truck) {
        setSource(truck.location || "");
        setDriverName(truck.driverName || "");
      }
    };
    fetchTruckDetails();
  }, [record.tankerId]); // [conversation_history:11]

  const handleUpdate = async (e) => {
    e.preventDefault();

    const total = Number(totalPumpOil || 0);
    const filled = Number(filledOil || 0);
    let remaining = Number(remainingOil || 0);

    if (!record.remainingOil && total > 0) {
      remaining = total - filled;
    }

    await updateDoc(doc(db, "tankerFillOperations", record.id), {
      totalPumpOil: total,
      filledOil: filled,
      remainingOil: remaining,
      source,
      dateTime,
      driverName,
      updatedAt: serverTimestamp(),
    });

    onCancel();
  };

  return (
    <div className="tanker-edit-form">
      <h3>✏️ Edit Tanker Fill Record</h3>
      <form onSubmit={handleUpdate} className="tanker-form">
        <label>Truck ID:</label>
        <input type="text" value={record.tankerId} disabled />

        <label>Total Pump Oil (L):</label>
        <input
          type="number"
          value={totalPumpOil}
          onChange={(e) => setTotalPumpOil(e.target.value)}
          required
        />

        <label>Filled Oil (L):</label>
        <input
          type="number"
          value={filledOil}
          onChange={(e) => setFilledOil(e.target.value)}
          required
        />

        <label>Remaining Oil (L):</label>
        <input
          type="number"
          value={remainingOil}
          onChange={(e) => setRemainingOil(e.target.value)}
          required
        />

        <label>Location:</label>
        <input
          type="text"
          value={source}
          readOnly
        />

        <label>Date & Time:</label>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          required
        />

        <label>Driver Name:</label>
        <input
          type="text"
          value={driverName}
          readOnly
        />

        <div className="form-actions">
          <button type="submit">Update</button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
