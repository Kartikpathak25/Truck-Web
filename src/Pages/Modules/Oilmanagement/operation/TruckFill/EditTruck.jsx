// src/Pages/Modules/Oilmanagement/operation/TruckFill/EditTruck.jsx
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../../../../../firebase";
import {
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  collection,
  query,
  where
} from "firebase/firestore";
import "./EditTruck.css";

export default function EditTruck({ record, onCancel, onSave }) {
  const auth = getAuth();
  const tankerId = record.tankerId;

  const [product, setProduct] = useState(record.product || "");
  const [totalPumpOil, setTotalPumpOil] = useState(record.totalPumpOil || 0);
  const [oldOil, setOldOil] = useState(record.oldOil || 0);
  const [filledOil, setFilledOil] = useState(record.filledOil || 0);
  const [finalOil, setFinalOil] = useState(record.finalOil || 0);
  const [pumpName, setPumpName] = useState(record.pumpName || "");
  const [dateReceived, setDateReceived] = useState(record.dateReceived || "");
  const [driverName, setDriverName] = useState(record.driverName || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTankerDetails = async () => {
      try {
        const q = query(
          collection(db, "tankers"),
          where("truckNumber", "==", tankerId)
        );

        const snap = await getDocs(q);
        if (!snap.empty) {
          const tanker = snap.docs[0].data();
          setPumpName(tanker.location || pumpName);
          setDriverName(tanker.driverName || driverName);
        }
      } catch (error) {
        console.error("Error fetching tanker details:", error);
      }
    };

    fetchTankerDetails();
  }, [tankerId, pumpName, driverName]);

  useEffect(() => {
    const old = Number(oldOil) || 0;
    const filled = Number(filledOil) || 0;
    const calculatedFinal = old + filled;
    setFinalOil(calculatedFinal);
  }, [oldOil, filledOil]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateDoc(doc(db, "tankerFillOperationsPump", record.id), {
        userId: auth.currentUser.uid,
        product,
        totalPumpOil: Number(totalPumpOil),
        oldOil: Number(oldOil),
        filledOil: Number(filledOil),
        finalOil: Number(finalOil),
        pumpName,
        dateReceived,
        driverName,
        updatedAt: serverTimestamp(),
      });

      const tankerQuery = query(
        collection(db, "tankers"),
        where("truckNumber", "==", tankerId)
      );
      const tankerSnap = await getDocs(tankerQuery);
      if (!tankerSnap.empty) {
        await updateDoc(doc(db, "tankers", tankerSnap.docs[0].id), {
          remainingOil: Number(finalOil),
        });
      }

      alert("✅ Record Updated Successfully!");
      if (onSave) onSave();
    } catch (error) {
      console.error("Update failed:", error);
      alert("❌ Update failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="truck-edit-form">
      <h3>✏️ Edit Tanker Pump Record</h3>

      <div className="edit-status-bar">
        <strong>🚚 TANKER ID:</strong> <span className="locked">{tankerId}</span>
      </div>

      <form onSubmit={handleUpdate} className="truck-edit-inner-form">
        <div className="form-row-split">
          <div>
            <label>Capacity (L):</label>
            <input
              type="number"
              value={totalPumpOil}
              readOnly
              className="auto-field"
            />
          </div>
          <div>
            <label>Old Oil (L):</label>
            <input
              type="number"
              value={oldOil}
              readOnly
              className="auto-field"
            />
          </div>
        </div>

        <div className="form-row-split">
          <div>
            <label>Product:</label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              required
            />
          </div>
          <div>
            <label>New Fill (L):</label>
            <input
              type="number"
              value={filledOil}
              onChange={(e) => setFilledOil(e.target.value)}
              required
              min="0"
            />
          </div>
        </div>

        <label className="final-oil-label">Final Oil (L):</label>
        <input
          type="number"
          value={finalOil}
          readOnly
          className="final-oil-field auto-field"
        />

        <div className="form-row-split">
          <div>
            <label>Pump:</label>
            <input
              type="text"
              value={pumpName}
              onChange={(e) => setPumpName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Date:</label>
            <input
              type="date"
              value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)}
              required
            />
          </div>
        </div>

        <label>Driver:</label>
        <input
          type="text"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          required
        />

        <div className="truck-edit-actions">
          <button type="submit" disabled={loading}>
            {loading ? "💾 Updating..." : "✅ Update Record"}
          </button>
          <button type="button" onClick={onCancel}>
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  );
}