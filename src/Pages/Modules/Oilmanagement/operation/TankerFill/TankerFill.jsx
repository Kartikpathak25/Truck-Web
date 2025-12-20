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
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./TankerFill.css";
import EditTanker from "./EditTanker";

export default function TankerFill({ onClose, showRecordsOnly = false }) {
  const [tankerId, setTankerId] = useState("");
  const [totalPumpOil, setTotalPumpOil] = useState("");
  const [filledOil, setFilledOil] = useState("");
  const [remainingOil, setRemainingOil] = useState("");
  const [source, setSource] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [driverName, setDriverName] = useState("");
  const [tankerOptions, setTankerOptions] = useState([]);
  const [records, setRecords] = useState([]);
  const [editRecord, setEditRecord] = useState(null);

  // Login user se default truck ID (optional)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("loggedUser");
      if (!stored) return;
      const user = JSON.parse(stored);
      if (user.vehicleId) {
        setTankerId(user.vehicleId);
      }
    } catch (err) {
      console.error("Failed to parse loggedUser", err);
    }
  }, []); // [conversation_history:16]

  // Fleet management se trucks fetch
  useEffect(() => {
    const fetchTrucks = async () => {
      const snapshot = await getDocs(collection(db, "trucks"));
      const list = snapshot.docs.map((docu) => ({
        id: docu.id,
        ...docu.data(),
      }));
      setTankerOptions(list);

      if (list.length && tankerId) {
        const selected = list.find((t) => t.truckNumber === tankerId);
        if (selected) {
          setSource(selected.location || "");
          setDriverName(selected.driverName || "");
        }
      }
    };
    fetchTrucks();
  }, [tankerId]); // [conversation_history:11]

  // Records live (latest first)
  useEffect(() => {
    const q = query(
      collection(db, "tankerFillOperations"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []); // [conversation_history:10]

  const resetForm = () => {
    setTotalPumpOil("");
    setFilledOil("");
    setRemainingOil("");
    setDateTime("");
  };

  // ✅ Final submit logic – remaining ko hi next total me dikhao
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tankerId || !filledOil || !dateTime || !driverName) return;

    const currentFilled = Number(filledOil);

    // IMPORTANT: ab sirf latest record le rahe hain (tankerId filter hata diya)
    const q = query(
      collection(db, "tankerFillOperations"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);

    let finalTotal = 0;
    let finalRemaining = 0;

    if (!snap.empty) {
      const last = snap.docs[0].data();
      const lastRemaining = Number(last.remainingOil || 0);

      if (lastRemaining > 0) {
        // Second / third time: total = last remaining
        finalTotal = lastRemaining;
      } else {
        // Pichla stock 0 tha → naya totalPumpOil chahiye
        if (!totalPumpOil) {
          alert("Your tanker oil finished, please fill again (enter Total Pump Oil).");
          return;
        }
        finalTotal = Number(totalPumpOil);
      }
    } else {
      // First time tanker load
      if (!totalPumpOil) {
        alert("First time ke liye Total Pump Oil enter karna zaruri hai.");
        return;
      }
      finalTotal = Number(totalPumpOil);
    }

    finalRemaining = finalTotal - currentFilled;

    if (finalRemaining < 0) {
      alert("Filled oil total se zyada hai. Values check karo.");
      return;
    }

    await addDoc(collection(db, "tankerFillOperations"), {
      tankerId,                 // jis truck ko fill kiya
      totalPumpOil: finalTotal, // tanker total before fill
      filledOil: currentFilled,
      remainingOil: finalRemaining,
      source,
      dateTime,
      driverName,
      createdAt: serverTimestamp(),
    });

    setRemainingOil(String(finalRemaining));
    setFilledOil("");
    setDateTime("");

    if (finalRemaining === 0) {
      alert("Your tanker oil finished, please fill again.");
      setTotalPumpOil(""); // next time new total daalna padega
    } else {
      // ✅ yahi tum chahte ho: remaining automatically total me aa jaye
      setTotalPumpOil(String(finalRemaining));
    }

    if (onClose) onClose();
  }; // [conversation_history:10]

  const handleCancel = () => {
    resetForm();
    if (onClose) onClose();
  };

  const handleDelete = async (id) =>
    await deleteDoc(doc(db, "tankerFillOperations", id));

  const handleEdit = (item) => setEditRecord(item);

  const handlePrint = () => {
    const docPdf = new jsPDF("p", "mm", "a4");
    autoTable(docPdf, {
      startY: 30,
      head: [
        [
          "Truck ID",
          "Total Pump Oil",
          "Filled Oil",
          "Remaining Oil",
          "Location",
          "Date & Time",
          "Driver Name",
        ],
      ],
      body: records.map((r) => [
        r.tankerId || "",
        r.totalPumpOil || "",
        r.filledOil || "",
        r.remainingOil || "",
        r.source || "",
        r.dateTime || "",
        r.driverName || "",
      ]),
      styles: {
        fontSize: 10,
        cellPadding: 2,
        valign: "middle",
        halign: "center",
      },
      headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: "bold" },
      margin: { top: 30 },
    });
    docPdf.save("tanker-fill-records.pdf");
  }; // [conversation_history:7]

  // 🔹 Truck select → driver/location + latest tanker remaining → total me
  const handleTruckSelect = async (truckNumber) => {
    setTankerId(truckNumber);

    const selectedTruck = tankerOptions.find(
      (t) => t.truckNumber === truckNumber
    );
    if (selectedTruck) {
      setSource(selectedTruck.location || "");
      setDriverName(selectedTruck.driverName || "");
    }

    // Sirf latest tanker record (truck filter nahi)
    const q = query(
      collection(db, "tankerFillOperations"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const lastRecord = snapshot.docs[0].data();
      const nextTotal = Number(
        lastRecord.remainingOil || lastRecord.totalPumpOil || 0
      );
      setTotalPumpOil(nextTotal ? String(nextTotal) : "");
      setRemainingOil(String(lastRecord.remainingOil || ""));
    } else {
      setTotalPumpOil("");
      setRemainingOil("");
    }
  }; // [conversation_history:8]

  return (
    <div className="tanker-fill">
      {editRecord ? (
        <EditTanker record={editRecord} onCancel={() => setEditRecord(null)} />
      ) : (
        !showRecordsOnly && (
          <>
            <h3>🚚 Fill Truck From: Tanker To Truck</h3>

            <form onSubmit={handleSubmit} className="tanker-form">
              <label>Truck ID:</label>
              <select
                value={tankerId}
                onChange={(e) => handleTruckSelect(e.target.value)}
                required
              >
                <option value="">Select Truck</option>
                {tankerOptions.map((truck) => (
                  <option key={truck.id} value={truck.truckNumber}>
                    {truck.truckNumber}
                  </option>
                ))}
              </select>

              <label>Total Pump Oil (L):</label>
              <input
                type="number"
                value={totalPumpOil}
                onChange={(e) => setTotalPumpOil(e.target.value)}
                placeholder="Enter only when new tanker loaded"
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
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
                readOnly
              />

              <label>Driver Name:</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
                readOnly
              />

              <label>Date & Time:</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />

              <div className="form-actions">
                <button type="submit">Add</button>
                <button type="button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </>
        )
      )}

      <div className="tanker-table">
        <div className="table-header">
          <h4>🚚 Tanker Fill Records : Multiple Truck filled</h4>
          <button className="print-btn" onClick={handlePrint}>
            🖨️ Print
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Truck ID</th>
              <th>Total Pump Oil</th>
              <th>Filled Oil</th>
              <th>Remaining Oil</th>
              <th>Location</th>
              <th>Date & Time</th>
              <th>Driver Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item.id}>
                <td>{item.tankerId}</td>
                <td>{item.totalPumpOil}</td>
                <td>{item.filledOil}</td>
                <td>{item.remainingOil}</td>
                <td>{item.source}</td>
                <td>{item.dateTime}</td>
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
