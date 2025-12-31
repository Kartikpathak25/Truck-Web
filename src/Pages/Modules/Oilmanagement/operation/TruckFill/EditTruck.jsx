import React, { useState, useEffect } from "react";
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
  /* ---------------- STATE ---------------- */
  const tankerId = record.tankerId; // read-only

  const [product, setProduct] = useState(record.product || "");
  const [totalPumpOil, setTotalPumpOil] = useState(record.totalPumpOil || 0);
  const [oldOil, setOldOil] = useState(record.oldOil || 0);      // ✅ oldOil field
  const [filledOil, setFilledOil] = useState(record.filledOil || 0);
  const [finalOil, setFinalOil] = useState(record.finalOil || 0); // ✅ finalOil field
  const [pumpName, setPumpName] = useState(record.pumpName || "");
  const [dateReceived, setDateReceived] = useState(record.dateReceived || "");
  const [driverName, setDriverName] = useState(record.driverName || "");
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH TANKER DETAILS ---------------- */
  useEffect(() => {
    const fetchTankerDetails = async () => {
      try {
        // ✅ tankers collection से data (trucks नहीं)
        const q = query(
          collection(db, "tankers"),
          where("truckNumber", "==", tankerId)
        );

        const snap = await getDocs(q);
        if (!snap.empty) {
          const tanker = snap.docs[0].data();
          // ✅ Auto fill from tanker data
          setPumpName(tanker.location || pumpName);
          setDriverName(tanker.driverName || driverName);
        }
      } catch (error) {
        console.error("Error fetching tanker details:", error);
      }
    };

    fetchTankerDetails();
  }, [tankerId, pumpName, driverName]);

  /* ---------------- AUTO CALCULATE FINAL OIL ---------------- */
  useEffect(() => {
    const old = Number(oldOil) || 0;
    const filled = Number(filledOil) || 0;
    const calculatedFinal = old + filled;
    setFinalOil(calculatedFinal);
  }, [oldOil, filledOil]);

  /* ---------------- UPDATE ---------------- */
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ tankerFillOperationsPump collection
      await updateDoc(doc(db, "tankerFillOperationsPump", record.id), {
        product,
        totalPumpOil: Number(totalPumpOil),
        oldOil: Number(oldOil),
        filledOil: Number(filledOil),
        finalOil: Number(finalOil),        // ✅ finalOil field
        pumpName,
        dateReceived,
        driverName,
        updatedAt: serverTimestamp(),
      });

      // ✅ Update tanker remainingOil भी
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
      if (onSave) onSave(); // ✅ Parent को notify
    } catch (error) {
      console.error("Update failed:", error);
      alert("❌ Update failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="truck-edit-form">
      <h3>✏️ Edit Tanker Pump Record</h3>
      
      {/* ✅ TANKER ID DISPLAY */}
      <div className="edit-status-bar">
        <strong>🚚 TANKER ID:</strong> <span className="locked">{tankerId}</span>
      </div>

      <form onSubmit={handleUpdate} className="truck-edit-inner-form">
        {/* ✅ READONLY FIELDS */}
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

        {/* ✅ EDITABLE FIELDS */}
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

        {/* ✅ AUTO CALCULATED */}
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
