// src/Pages/Modules/Oilmanagement/operation/TankerFill/EditTanker.jsx
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../../../../../firebase";
import { updateDoc, doc, serverTimestamp, getDocs, collection, query, where, limit } from "firebase/firestore";
import "./TankerFill.css";

export default function EditTanker({ record, onCancel }) {
  const auth = getAuth();

  const [totalPumpOil, setTotalPumpOil] = useState(record.totalPumpOil ?? "");
  const [filledOil, setFilledOil] = useState(record.filledOil ?? "");
  const [remainingOil, setRemainingOil] = useState(record.remainingOil ?? "");
  const [previousReading, setPreviousReading] = useState(record.previousReading ?? "");
  const [currentReading, setCurrentReading] = useState(record.currentReading ?? "");
  const [source, setSource] = useState(record.source ?? "");
  const [dateTime, setDateTime] = useState(record.dateTime ?? "");
  const [driverName, setDriverName] = useState(record.driverName ?? "");

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      if (!record.truckId) return;

      const vq = query(
        collection(db, "trucks"),
        where("truckNumber", "==", record.truckId),
        limit(1)
      );
      const snap = await getDocs(vq);

      if (!snap.empty) {
        const vehicle = snap.docs[0].data();
        setSource(vehicle.location || "");
        setDriverName(vehicle.driverName || "");
      }
    };

    fetchVehicleDetails();
  }, [record.truckId]);

  useEffect(() => {
    const total = Number(totalPumpOil || 0);
    const filled = Number(filledOil || 0);
    const rem = Math.max(total - filled, 0);
    setRemainingOil(String(rem));
  }, [totalPumpOil, filledOil]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    const total = Number(totalPumpOil || 0);
    const filled = Number(filledOil || 0);
    const remaining = Number(remainingOil || 0);
    const prevR = Number(previousReading || 0);
    const currR = Number(currentReading || 0);

    if (currR < prevR) {
      alert("Current reading cannot be less than Previous reading");
      return;
    }

    try {
      await updateDoc(doc(db, "tankerFillOperations", record.id), {
        userId: auth.currentUser.uid,
        totalPumpOil: total,
        filledOil: filled,
        remainingOil: remaining,
        previousReading: prevR,
        currentReading: currR,
        source,
        dateTime,
        driverName,
        updatedAt: serverTimestamp(),
      });

      alert("✅ Record updated successfully!");
      onCancel();
      window.location.reload();
    } catch (err) {
      console.error("Update failed:", err);
      alert("❌ Update failed: " + err.message);
    }
  };

  return (
    <div className="tanker-edit-form">
      <h3>✏️ Edit Tanker Fill Record</h3>
      <form onSubmit={handleUpdate} className="tanker-form">
        <label>Tanker ID:</label>
        <input type="text" value={record.tankerId || "-"} readOnly />

        <label>Vehicle ID:</label>
        <input type="text" value={record.truckId || "-"} readOnly />

        <label>Previous Reading:</label>
        <input type="number" value={previousReading} onChange={(e) => setPreviousReading(e.target.value)} />

        <label>Current Reading:</label>
        <input type="number" value={currentReading} onChange={(e) => setCurrentReading(e.target.value)} required />

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
        <input type="number" value={remainingOil} readOnly />

        <label>Location:</label>
        <input type="text" value={source} readOnly />

        <label>Date & Time:</label>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          required
        />

        <label>Driver Name:</label>
        <input type="text" value={driverName} readOnly />

        <div className="form-actions">
          <button type="submit">Update</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}