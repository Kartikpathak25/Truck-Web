import React, { useEffect, useMemo, useState } from "react";
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
  updateDoc,
} from "firebase/firestore";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./TankerFill.css";
import EditTanker from "./EditTanker";

export default function TankerFill({ onClose, showRecordsOnly = false }) {
  // ✅ Assigned tanker (login) - read only
  const [tankerId, setTankerId] = useState("");

  // ✅ Truck selected from dropdown
  const [selectedTruckId, setSelectedTruckId] = useState("");

  // ✅ Oil states
  const [totalPumpOil, setTotalPumpOil] = useState("");
  const [filledOil, setFilledOil] = useState("");
  const [remainingOil, setRemainingOil] = useState("");

  // ✅ Auto info
  const [source, setSource] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [driverName, setDriverName] = useState("");

  const [tankerOptions, setTankerOptions] = useState([]);
  const [activeTankerOptions, setActiveTankerOptions] = useState([]);

  const [records, setRecords] = useState([]);
  const [editRecord, setEditRecord] = useState(null);
  const [showOverfillPopup, setShowOverfillPopup] = useState(false);

  const [isLoadingUserVehicle, setIsLoadingUserVehicle] = useState(true);

  // ✅ Keep tanker docId so we can update remainingOil after every operation
  const [tankerDocId, setTankerDocId] = useState("");

  const loggedUser = useMemo(() => {
    const stored = localStorage.getItem("loggedUser");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  // ✅ 1) Get assigned tankerId from user object (your real fields)
  const getAssignedTankerIdFromUser = (user) => {
    if (!user) return "";
    // Screenshot field:
    // assignedType: "Tanker", assignedTruckNumber: "BR01AP2051"
    if (user.assignedTruckNumber) return String(user.assignedTruckNumber);

    return String(user.tankerId || user.tankerNumber || user.assignedTanker || "");
  };

  // ✅ 2) Fetch tanker current oil from tankers collection (UPDATED by TruckFill)
  const loadTankerCurrentOilFromFleet = async (currentTankerId) => {
    if (!currentTankerId) return;

    const tq = query(
      collection(db, "tankers"),
      where("truckNumber", "==", currentTankerId),
      limit(1)
    );
    const snap = await getDocs(tq);

    if (!snap.empty) {
      const tankerDoc = snap.docs[0];
      const tanker = tankerDoc.data();

      setTankerDocId(tankerDoc.id);

      const fleetRemaining = Number(tanker.remainingOil ?? 0);
      const fleetCapacity = Number(tanker.capacity ?? 0);

      // ✅ Total Pump Oil = current remaining oil in tanker (latest pump fill result)
      setTotalPumpOil(fleetRemaining ? String(fleetRemaining) : "");
      setRemainingOil(fleetRemaining ? String(fleetRemaining) : "");

      // Optional auto fields
      setSource((prev) => prev || tanker.location || "");
      setDriverName((prev) => prev || tanker.driverName || "");

      // If tanker has 0 remaining but capacity exists, keep capacity in placeholder sense
      if (!fleetRemaining && fleetCapacity && !totalPumpOil) {
        // no hard set, because you want remaining as truth
      }
      return;
    }

    // fallback if tanker not found in tankers collection
    setTankerDocId("");
  };

  // ✅ 3) fallback: If tankers doc not found, load last operation from tankerFillOperations (desc + limit)
  const loadLastOperationFallback = async (currentTankerId) => {
    if (!currentTankerId) return;

    const qLast = query(
      collection(db, "tankerFillOperations"),
      where("tankerId", "==", currentTankerId),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const snap = await getDocs(qLast);

    if (!snap.empty) {
      const last = snap.docs[0].data();
      const nextTotal = Number(last.remainingOil ?? last.totalPumpOil ?? 0);
      setTotalPumpOil(nextTotal ? String(nextTotal) : "");
      setRemainingOil(String(last.remainingOil ?? ""));
    }
  };

  // ✅ Load user tankerId + user defaults
  useEffect(() => {
    const run = async () => {
      try {
        setIsLoadingUserVehicle(true);

        if (!loggedUser) return;

        const assignedTanker = getAssignedTankerIdFromUser(loggedUser);
        if (assignedTanker) setTankerId(assignedTanker);

        // defaults from logged user
        if (loggedUser.location) setSource(String(loggedUser.location));
        if (loggedUser.driverName) setDriverName(String(loggedUser.driverName));
      } finally {
        setIsLoadingUserVehicle(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ When tankerId is ready -> load current oil from tankers
  useEffect(() => {
    const run = async () => {
      if (!tankerId) return;

      await loadTankerCurrentOilFromFleet(tankerId);

      // If tankers doc not found or remaining still empty, use fallback
      // (Order/limit pattern supported with orderBy + limit) [web:55]
      if (!tankerDocId) {
        await loadLastOperationFallback(tankerId);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tankerId]);

  // ✅ Fetch trucks for dropdown
  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const snapshot = await getDocs(collection(db, "trucks"));
        const allTrucks = snapshot.docs.map((docu) => ({
          id: docu.id,
          ...docu.data(),
        }));

        const activeTrucks = allTrucks.filter((truck) => {
          const status = truck.status?.toLowerCase();
          const maintenanceStatus = truck.maintenanceStatus?.toLowerCase();
          const isActive =
            truck.isActive === true ||
            status === "active" ||
            maintenanceStatus === "active" ||
            !truck.isMaintenance;
          return isActive;
        });

        setTankerOptions(allTrucks);
        setActiveTankerOptions(activeTrucks);
      } catch (error) {
        console.error("Error fetching trucks:", error);
      }
    };

    fetchTrucks();
  }, []);

  // ✅ Records live
  useEffect(() => {
    const qRec = query(
      collection(db, "tankerFillOperations"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(qRec, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const resetForm = () => {
    setFilledOil("");
    setDateTime("");
    setShowOverfillPopup(false);
  };

  // ✅ Print
  const handlePrintSingleRecord = (record) => {
    const docPdf = new jsPDF("p", "mm", "a4");
    docPdf.setFontSize(20);
    docPdf.setFont("helvetica", "bold");
    docPdf.text("Tanker Fill Record", 20, 25);

    docPdf.setFontSize(12);
    docPdf.setFont("helvetica", "normal");

    const details = [
      ["Tanker ID:", record.tankerId || "N/A"],
      ["Truck ID:", record.truckId || "N/A"],
      ["Total Pump Oil:", `${record.totalPumpOil || 0} L`],
      ["Filled Oil:", `${record.filledOil || 0} L`],
      ["Remaining Oil:", `${record.remainingOil || 0} L`],
      ["Location:", record.source || "N/A"],
      ["Date & Time:", record.dateTime || "N/A"],
      ["Driver Name:", record.driverName || "N/A"],
    ];

    let yPosition = 45;
    details.forEach(([label, value]) => {
      docPdf.text(label, 20, yPosition);
      docPdf.text(value, 80, yPosition);
      yPosition += 8;
    });

    docPdf.save(
      `tanker-record-${record.tankerId || "single"}-${Date.now()}.pdf`
    );
  };

  const handlePrintAllRecords = () => {
    const docPdf = new jsPDF("p", "mm", "a4");
    autoTable(docPdf, {
      startY: 30,
      head: [
        [
          "Tanker ID",
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
        r.truckId || "",
        `${r.totalPumpOil || 0} L`,
        `${r.filledOil || 0} L`,
        `${r.remainingOil || 0} L`,
        r.source || "",
        r.dateTime || "",
        r.driverName || "",
      ]),
      styles: { fontSize: 10, cellPadding: 2, valign: "middle", halign: "center" },
      headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: "bold" },
      margin: { top: 30 },
    });
    docPdf.save("tanker-fill-records.pdf");
  };

  // ✅ Submit (Fill Truck from Tanker)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tankerId) return alert("Assigned Tanker ID missing.");
    if (!selectedTruckId) return alert("Please select Truck ID.");
    if (!filledOil) return alert("Please enter Filled Oil.");
    if (!dateTime) return alert("Please select Date & Time.");
    if (!driverName) return alert("Driver name missing.");

    const currentFilled = Number(filledOil);
    const currentTotal = Number(totalPumpOil || 0);

    if (!currentTotal) {
      alert("Tanker oil is 0. Please fill tanker from pump first.");
      return;
    }

    if (currentFilled > currentTotal) {
      setShowOverfillPopup(true);
      return;
    }

    const finalRemaining = currentTotal - currentFilled;

    try {
      // ✅ Save operation record
      await addDoc(collection(db, "tankerFillOperations"), {
        tankerId,
        truckId: selectedTruckId,
        totalPumpOil: currentTotal,
        filledOil: currentFilled,
        remainingOil: finalRemaining,
        source,
        dateTime,
        driverName,
        createdAt: serverTimestamp(),
      });

      // ✅ Update tanker remainingOil in fleet (single source of truth)
      if (tankerDocId) {
        await updateDoc(doc(db, "tankers", tankerDocId), {
          remainingOil: finalRemaining,
        });
      }

      // ✅ Update UI
      setRemainingOil(String(finalRemaining));
      setTotalPumpOil(String(finalRemaining));

      resetForm();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Failed to save record: " + error.message);
    }
  };

  const handleCancel = () => {
    resetForm();
    if (onClose) onClose();
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "tankerFillOperations", id));
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record.");
    }
  };

  const handleTruckSelect = async (truckNumber) => {
    setSelectedTruckId(truckNumber);

    const selectedTruck = activeTankerOptions.find((t) => t.truckNumber === truckNumber);
    if (selectedTruck) {
      setSource(selectedTruck.location || source || "");
      setDriverName(selectedTruck.driverName || driverName || "");
    }

    // ✅ When truck changes, tanker oil should remain tanker-based
    // reload from tankers (latest)
    if (tankerId) await loadTankerCurrentOilFromFleet(tankerId);
  };

  return (
    <div className="tanker-fill">
      {editRecord ? (
        <EditTanker record={editRecord} onCancel={() => setEditRecord(null)} />
      ) : (
        <>
          {!showRecordsOnly && (
            <>
              <h3>Fill Truck From Tanker</h3>

              {isLoadingUserVehicle ? (
                <div className="loading-indicator">Loading your tanker...</div>
              ) : (
                <form onSubmit={handleSubmit} className="tanker-form">
                  <label>Tanker ID (Assigned):</label>
                  <input type="text" value={tankerId} readOnly />

                  <label>Truck ID:</label>
                  <select
                    value={selectedTruckId}
                    onChange={(e) => handleTruckSelect(e.target.value)}
                    required
                  >
                    <option value="">Select Active Truck</option>
                    {activeTankerOptions.map((truck) => (
                      <option key={truck.id} value={truck.truckNumber}>
                        {truck.truckNumber}
                      </option>
                    ))}
                  </select>

                  <label>Total Pump Oil (L):</label>
                  <input type="number" value={totalPumpOil} readOnly />

                  <label>Filled Oil (L):</label>
                  <input
                    type="number"
                    value={filledOil}
                    onChange={(e) => setFilledOil(e.target.value)}
                    required
                    min="0"
                  />

                  <label>Remaining Oil (L):</label>
                  <input type="number" value={remainingOil} readOnly />

                  <label>Location:</label>
                  <input type="text" value={source} readOnly />

                  <label>Driver Name:</label>
                  <input type="text" value={driverName} readOnly />

                  <label>Date & Time:</label>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    required
                  />

                  <div className="form-actions">
                    <button type="submit">Add Record</button>
                    <button type="button" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {tankerOptions.length > activeTankerOptions.length && (
                <div className="maintenance-warning">
                  ℹ️ {tankerOptions.length - activeTankerOptions.length} vehicles
                  in maintenance (hidden).
                </div>
              )}
            </>
          )}
        </>
      )}

      {showOverfillPopup && (
        <div className="overfill-popup">
          <div className="popup-content">
            <h4>Overfilled</h4>
            <p>
              Filled oil (<strong>{filledOil}L</strong>) exceeds available oil (
              <strong>{totalPumpOil}L</strong>).
            </p>
            <div className="popup-actions">
              <button onClick={() => setShowOverfillPopup(false)}>
                OK, I'll Fix
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="tanker-table">
        <div className="table-header">
          <h4>Tanker Fill Records</h4>
          <button className="print-btn" onClick={handlePrintAllRecords}>
            Print All
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tanker ID</th>
              <th>Truck ID</th>
              <th>Total (L)</th>
              <th>Filled (L)</th>
              <th>Remaining (L)</th>
              <th>Location</th>
              <th>Date</th>
              <th>Driver</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item.id}>
                <td>{item.tankerId}</td>
                <td>{item.truckId || "-"}</td>
                <td>{item.totalPumpOil}</td>
                <td>{item.filledOil}</td>
                <td>{item.remainingOil}</td>
                <td>{item.source}</td>
                <td>{item.dateTime}</td>
                <td>{item.driverName}</td>
                <td>
                  <button onClick={() => handlePrintSingleRecord(item)} title="Print">
                    🖨️
                  </button>
                  <button onClick={() => setEditRecord(item)} title="Edit">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(item.id)} title="Delete">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
