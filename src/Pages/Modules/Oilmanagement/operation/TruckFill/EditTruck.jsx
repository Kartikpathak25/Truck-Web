import React, { useState, useEffect } from "react";
import { db } from "../../../../../firebase";
import { updateDoc, doc, serverTimestamp, getDocs, collection } from "firebase/firestore";
import "./EditTruck.css";

export default function EditTruck({ record, onCancel }) {
  const [tankerId] = useState(record.tankerId); // read-only
  const [product, setProduct] = useState(record.product);
  const [totalPumpOil, setTotalPumpOil] = useState(record.totalPumpOil || "");
  const [filledOil, setFilledOil] = useState(record.filledOil || "");
  const [remainingOil, setRemainingOil] = useState(record.remainingOil || "");
  const [pumpName, setPumpName] = useState(record.pumpName);
  const [dateReceived, setDateReceived] = useState(record.dateReceived);
  const [driverName, setDriverName] = useState(record.driverName);

  // ✅ Auto-fetch driverName + location (pumpName) from trucks collection
  useEffect(() => {
    const fetchTruckDetails = async () => {
      const snapshot = await getDocs(collection(db, "trucks"));
      const truck = snapshot.docs.map(d => d.data()).find(t => t.truckNumber === tankerId);
      if (truck) {
        setDriverName(truck.driverName || driverName);
        setPumpName(truck.location || pumpName); // 👈 using location as pumpName
      }
    };
    fetchTruckDetails();
  }, [tankerId]);

  // ✅ Auto-calc remainingOil when filledOil changes
  useEffect(() => {
    if (totalPumpOil && filledOil) {
      const total = Number(totalPumpOil);
      const filled = Number(filledOil);
      setRemainingOil(total - filled);
    }
  }, [totalPumpOil, filledOil]);

  const handleUpdate = async e => {
    e.preventDefault();
    await updateDoc(doc(db, "truckFillOperations", record.id), {
      product,
      totalPumpOil: Number(totalPumpOil),
      filledOil: Number(filledOil),
      remainingOil: Number(remainingOil),
      pumpName,
      dateReceived,
      driverName,
      updatedAt: serverTimestamp(),
    });
    onCancel();
  };

  return (
    <div className="truck-edit-form">
      <h3>✏️ Edit Truck Fill Record</h3>
      <form onSubmit={handleUpdate} className="truck-edit-inner-form">
        <label>Tanker ID:</label>
        <input type="text" value={tankerId} disabled />

        <label>Product:</label>
        <input
          type="text"
          value={product}
          onChange={e => setProduct(e.target.value)}
          required
        />

        <label>Total Pump Oil (L):</label>
        <input
          type="number"
          value={totalPumpOil}
          onChange={e => setTotalPumpOil(e.target.value)}
          required
        />

        <label>Filled Oil (L):</label>
        <input
          type="number"
          value={filledOil}
          onChange={e => setFilledOil(e.target.value)}
          required
        />

        <label>Remaining Oil (L):</label>
        <input
          type="number"
          value={remainingOil}
          readOnly
        />

        <label>Pump Name:</label>
        <input
          type="text"
          value={pumpName}
          onChange={e => setPumpName(e.target.value)}
          required
        />

        <label>Date Received:</label>
        <input
          type="date"
          value={dateReceived}
          onChange={e => setDateReceived(e.target.value)}
          required
        />

        <label>Driver Name:</label>
        <input
          type="text"
          value={driverName}
          onChange={e => setDriverName(e.target.value)}
          required
        />

        <div className="truck-edit-actions">
          <button type="submit">Update</button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
