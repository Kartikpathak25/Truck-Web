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

  // ✅ Selected vehicle/truck
  const [selectedTruckId, setSelectedTruckId] = useState("");

  // ✅ Readings
  const [previousReading, setPreviousReading] = useState("");
  const [currentReading, setCurrentReading] = useState("");

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

  // ✅ tanker doc id (tankers collection)
  const [tankerDocId, setTankerDocId] = useState("");

  // ✅ selected vehicle doc id (trucks collection) for updating reading
  const [selectedTruckDocId, setSelectedTruckDocId] = useState("");

  const loggedUser = useMemo(() => {
    const stored = localStorage.getItem("loggedUser");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  const getAssignedTankerIdFromUser = (user) => {
    if (!user) return "";
    if (user.assignedTruckNumber) return String(user.assignedTruckNumber);
    return String(user.tankerId || user.tankerNumber || user.assignedTanker || "");
  };

  // ✅ Fetch tanker oil from tankers collection
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
      setTotalPumpOil(fleetRemaining ? String(fleetRemaining) : "");
      setRemainingOil(fleetRemaining ? String(fleetRemaining) : "");

      setSource((prev) => prev || tanker.location || "");
      setDriverName((prev) => prev || tanker.driverName || "");
      return;
    }

    setTankerDocId("");
  };

  // ✅ fallback: last tankerFillOperations record (if tankers doc missing)
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

  // ✅ Fetch selected vehicle reading from trucks collection
  const loadVehicleReading = async (vehicleNumber) => {
    setSelectedTruckDocId("");
    setPreviousReading("");
    setCurrentReading("");

    if (!vehicleNumber) return;

    const vq = query(
      collection(db, "trucks"),
      where("truckNumber", "==", vehicleNumber),
      limit(1)
    );
    const snap = await getDocs(vq);

    if (!snap.empty) {
      const vDoc = snap.docs[0];
      const vData = vDoc.data();

      setSelectedTruckDocId(vDoc.id);

      const prev = Number(vData.currentReading ?? 0);
      setPreviousReading(String(prev));
      setCurrentReading(""); // manual fill

      // auto fields from selected vehicle (optional)
      setSource(vData.location || source || "");
      setDriverName(vData.driverName || driverName || "");
    } else {
      // If truck doc not found
      setPreviousReading("0");
      setCurrentReading("");
    }
  };

  // ✅ Load user tankerId + defaults
  useEffect(() => {
    const run = async () => {
      try {
        setIsLoadingUserVehicle(true);
        if (!loggedUser) return;

        const assignedTanker = getAssignedTankerIdFromUser(loggedUser);
        if (assignedTanker) setTankerId(assignedTanker);

        if (loggedUser.location) setSource(String(loggedUser.location));
        if (loggedUser.driverName) setDriverName(String(loggedUser.driverName));
      } finally {
        setIsLoadingUserVehicle(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ load tanker oil when tankerId is ready
  useEffect(() => {
    const run = async () => {
      if (!tankerId) return;

      await loadTankerCurrentOilFromFleet(tankerId);

      if (!tankerDocId) {
        await loadLastOperationFallback(tankerId);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tankerId]);

  // ✅ Fetch vehicles for dropdown
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
    setCurrentReading(""); // keep previousReading as-is
  };

  // ✅ Vehicle select
  const handleTruckSelect = async (truckNumber) => {
    setSelectedTruckId(truckNumber);

    // fetch selected vehicle currentReading -> previousReading
    await loadVehicleReading(truckNumber);

    // reload tanker remaining oil (optional refresh)
    if (tankerId) await loadTankerCurrentOilFromFleet(tankerId);
  };

  // ✅ Submit (Fill Truck from Tanker)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tankerId) return alert("Assigned Tanker ID missing.");
    if (!selectedTruckId) return alert("Please select Vehicle ID.");
    if (!filledOil) return alert("Please enter Filled Oil.");
    if (!dateTime) return alert("Please select Date & Time.");
    if (!driverName) return alert("Driver name missing.");

    // readings validation
    const prevR = Number(previousReading || 0);
    const currR = Number(currentReading || 0);

    if (!currentReading) return alert("Please enter Current Reading.");
    if (currR < prevR) return alert("Current reading cannot be less than Previous reading.");

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
        truckId: selectedTruckId, // (you can rename to vehicleId later if you want)
        totalPumpOil: currentTotal,
        filledOil: currentFilled,
        remainingOil: finalRemaining,
        previousReading: prevR,
        currentReading: currR,
        source,
        dateTime,
        driverName,
        createdAt: serverTimestamp(),
      });

      // ✅ Update tanker remainingOil
      if (tankerDocId) {
        await updateDoc(doc(db, "tankers", tankerDocId), {
          remainingOil: finalRemaining,
          updatedAt: serverTimestamp(),
        });
      }

      // ✅ Update selected vehicle reading so next time previousReading auto comes
      if (selectedTruckDocId) {
        await updateDoc(doc(db, "trucks", selectedTruckDocId), {
          currentReading: currR,
          updatedAt: serverTimestamp(),
        });
      }

      // ✅ UI update
      setRemainingOil(String(finalRemaining));
      setTotalPumpOil(String(finalRemaining));

      // after save: previousReading should become currentReading for next time
      setPreviousReading(String(currR));
      setCurrentReading("");

      resetForm();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Failed to save record: " + error.message);
    }
  };

  // ✅ Print functions (same, but add readings in details)
  const handlePrintSingleRecord = (record) => {
    const docPdf = new jsPDF("p", "mm", "a4");
    docPdf.setFontSize(20);
    docPdf.setFont("helvetica", "bold");
    docPdf.text("Tanker Fill Record", 20, 25);

    docPdf.setFontSize(12);
    docPdf.setFont("helvetica", "normal");

    const details = [
      ["Tanker ID:", record.tankerId || "N/A"],
      ["Vehicle ID:", record.truckId || "N/A"],
      ["Prev Reading:", String(record.previousReading ?? "0")],
      ["Current Reading:", String(record.currentReading ?? "0")],
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

    docPdf.save(`tanker-record-${record.tankerId || "single"}-${Date.now()}.pdf`);
  };

  const handlePrintAllRecords = () => {
    const docPdf = new jsPDF("p", "mm", "a4");
    autoTable(docPdf, {
      startY: 30,
      head: [
        [
          "Tanker ID",
          "Vehicle ID",
          "Prev",
          "Current",
          "Total",
          "Filled",
          "Remaining",
          "Location",
          "Date & Time",
          "Driver",
        ],
      ],
      body: records.map((r) => [
        r.tankerId || "",
        r.truckId || "",
        r.previousReading ?? 0,
        r.currentReading ?? 0,
        `${r.totalPumpOil || 0}`,
        `${r.filledOil || 0}`,
        `${r.remainingOil || 0}`,
        r.source || "",
        r.dateTime || "",
        r.driverName || "",
      ]),
      styles: { fontSize: 9, cellPadding: 2, valign: "middle", halign: "center" },
      headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: "bold" },
      margin: { top: 30 },
    });
    docPdf.save("tanker-fill-records.pdf");
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

                  <label>Vehicle ID:</label>
                  <select
                    value={selectedTruckId}
                    onChange={(e) => handleTruckSelect(e.target.value)}
                    required
                  >
                    <option value="">Select Active Vehicle</option>
                    {activeTankerOptions.map((truck) => (
                      <option key={truck.id} value={truck.truckNumber}>
                        {truck.truckNumber}
                      </option>
                    ))}
                  </select>

                  <label>Previous Reading:</label>
                  <input type="number" value={previousReading} readOnly />

                  <label>Current Reading:</label>
                  <input
                    type="number"
                    value={currentReading}
                    onChange={(e) => setCurrentReading(e.target.value)}
                    required
                    min="0"
                  />

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
                  ℹ️ {tankerOptions.length - activeTankerOptions.length} vehicles in
                  maintenance (hidden).
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
              <button onClick={() => setShowOverfillPopup(false)}>OK, I'll Fix</button>
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
              <th>Vehicle ID</th>
              <th>Prev</th>
              <th>Current</th>
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
                <td>{item.previousReading ?? 0}</td>
                <td>{item.currentReading ?? 0}</td>
                <td>{item.totalPumpOil}</td>
                <td>{item.filledOil}</td>
                <td>{item.remainingOil}</td>
                <td>{item.source}</td>
                <td>{item.dateTime}</td>
                <td>{item.driverName}</td>
                <td>
                  <button onClick={() => handlePrintSingleRecord(item)} title="Print">🖨️</button>
                  <button onClick={() => setEditRecord(item)} title="Edit">✏️</button>
                  <button onClick={() => handleDelete(item.id)} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
