// src/Pages/Modules/Oilmanagement/operation/TruckFill/TruckFill.jsx
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../../../../../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  onSnapshot
} from "firebase/firestore";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./TruckFill.css";
import EditTruck from "./EditTruck";

export default function TruckFill({ onClose, showRecordsOnly = false, isAdmin = false }) {
  const auth = getAuth();

  const [tankerId, setTankerId] = useState("");
  const [product, setProduct] = useState("");
  const [totalPumpOil, setTotalPumpOil] = useState("");
  const [oldOil, setOldOil] = useState("");
  const [filledOil, setFilledOil] = useState("");
  const [finalOil, setFinalOil] = useState("");
  const [pumpName, setPumpName] = useState("");
  const [dateReceived, setDateReceived] = useState("");
  const [driverName, setDriverName] = useState("");

  const [pumpRecords, setPumpRecords] = useState([]);
  const [editRecord, setEditRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isTankerAccess, setIsTankerAccess] = useState(false);
  const [showOverfillPopup, setShowOverfillPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedUser"));
    setUserData(user);

    const role = user?.role?.toLowerCase() || "";
    const admin = role === "admin" || isAdmin;

    setCanEdit(admin);
    setIsTankerAccess(true);

    if (!admin) {
      setTankerId(user.assignedTruckNumber || user.assignedId || "");
    }

    setDateReceived(new Date().toISOString().split("T")[0]);
  }, [isAdmin]);




  useEffect(() => {
    if (!tankerId) return;

    const q = query(
      collection(db, "tankers"),
      where("truckNumber", "==", tankerId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const tanker = snapshot.docs[0].data();

        setTotalPumpOil(tanker.capacity || 0);
        setOldOil(tanker.remainingOil || 0);
        setPumpName(tanker.location || "Pump Station");
        setDriverName(tanker.driverName || "");
      } else {
        // reset if tankerId invalid
        setTotalPumpOil("");
        setOldOil("");
        setPumpName("");
        setDriverName("");
      }
    });

    return () => unsub();
  }, [tankerId]);


  useEffect(() => {
    if (!tankerId) {
      setPumpRecords([]);
      return;
    }

    const q = query(
      collection(db, "tankerFillOperationsPump"),
      where("tankerId", "==", tankerId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      data.sort(
        (a, b) => new Date(b.dateReceived) - new Date(a.dateReceived)
      );

      setPumpRecords(data);
    });

    return () => unsub();
  }, [tankerId]);

  useEffect(() => {
    const old = Number(oldOil) || 0;
    const filled = Number(filledOil) || 0;
    setFinalOil((old + filled).toString());
  }, [oldOil, filledOil]);

  const resetForm = () => {
    setProduct("");
    setFilledOil("");
    setFinalOil("");
  };

  const printAllRecords = () => {
    if (pumpRecords.length === 0) {
      alert("❌ No records to print!");
      return;
    }

    const printData = pumpRecords.map(record => [
      record.dateReceived || '',
      record.tankerId || '',
      record.product || '',
      `${record.totalPumpOil || 0}L`,
      `${record.oldOil || 0}L`,
      `${record.filledOil || 0}L`,
      `${record.finalOil || 0}L`,
      record.pumpName || '',
      record.driverName || ''
    ]);

    const doc = new jsPDF('l', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text(`Tanker Pump Records - ${tankerId}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Total Records: ${pumpRecords.length}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Tanker ID', 'Product', 'Capacity(L)', 'Old Oil(L)', 'Filled(L)', 'Final(L)', 'Pump', 'Driver']],
      body: printData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 25 },
        6: { cellWidth: 15, fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    doc.save(`Tanker_${tankerId}_Records_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const printSingleRecord = (record) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('🛢️ Tanker Fill Record', 105, 30, { align: 'center' });

    doc.setFontSize(14);
    doc.text(`Tanker ID: ${record.tankerId}`, 20, 60);
    doc.text(`Date: ${record.dateReceived}`, 20, 80);
    doc.text(`Product: ${record.product}`, 20, 100);

    doc.setFontSize(16);
    doc.text(`Capacity: ${record.totalPumpOil}L`, 20, 125);
    doc.text(`Old Oil: ${record.oldOil || 0}L`, 20, 145);
    doc.text(`Filled: ${record.filledOil}L`, 20, 165);
    doc.setFontSize(18);
    doc.text(`Final Oil: ${record.finalOil}L`, 20, 190, { fontStyle: 'bold' });

    doc.setFontSize(12);
    doc.text(`Pump: ${record.pumpName}`, 20, 215);
    doc.text(`Driver: ${record.driverName}`, 20, 230);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 245);

    doc.save(`Record_${record.tankerId}_${record.dateReceived}.pdf`);
  };

  useEffect(() => {
    setIsLoading(true);

    let q;

    if (canEdit) {
      // ADMIN → all records
      q = query(collection(db, "tankerFillOperationsPump"));
    } else if (tankerId) {
      // TANKER → own tanker only
      q = query(
        collection(db, "tankerFillOperationsPump"),
        where("tankerId", "==", tankerId)
      );
    } else {
      setIsLoading(false);
      return;
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      data.sort(
        (a, b) => new Date(b.dateReceived || 0) - new Date(a.dateReceived || 0)
      );

      setPumpRecords(data);
      setIsLoading(false);
    });

    return () => unsub();
  }, [tankerId, canEdit]);

  //     const tankerQuery = query(
  //       collection(db, "tankers"),
  //       where("truckNumber", "==", tankerId)
  //     );

  //     const tankerSnap = await onSnapshot(tankerQuery);

  //     if (!tankerSnap.empty) {
  //       const tankerDoc = tankerSnap.docs[0];
  //       await updateDoc(doc(db, "tankers", tankerDoc.id), {
  //         remainingOil: final,
  //       });
  //     }

  //     alert("✅ Tanker filled & pump record saved!");
  //     resetForm();

  //   } catch (error) {
  //     console.error("Submit error:", error);
  //     alert("❌ Save failed: " + error.message);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const onSubmitPumpFill = async (e) => {
    e.preventDefault();

    const capacity = Number(totalPumpOil);
    const final = Number(finalOil);

    if (final > capacity) {
      setShowOverfillPopup(true);
      return;
    }

    try {
      setIsLoading(true);

      // ✅ Save pump record
      await addDoc(collection(db, "tankerFillOperationsPump"), {
        userId: auth.currentUser.uid,
        tankerId,
        product,
        totalPumpOil: capacity,
        oldOil: Number(oldOil),
        filledOil: Number(filledOil),
        finalOil: final,
        pumpName,
        driverName,
        dateReceived,
        createdAt: serverTimestamp(),
      });

      // ✅ Update tanker remaining oil
      const tankerQuery = query(
        collection(db, "tankers"),
        where("truckNumber", "==", tankerId)
      );

      const unsub = onSnapshot(tankerQuery, async (snap) => {
        if (!snap.empty) {
          const tankerDoc = snap.docs[0];
          await updateDoc(doc(db, "tankers", tankerDoc.id), {
            remainingOil: final,
            updatedAt: serverTimestamp(), // 🔥 REQUIRED BY YOUR RULES
          });
        }
        unsub(); // stop listener immediately
      });

      alert("✅ Tanker filled & pump record saved!");
      resetForm();

    } catch (err) {
      console.error(err);
      alert("❌ Save failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    const capacity = Number(totalPumpOil);
    const final = Number(finalOil);

    if (final > capacity) {
      setShowOverfillPopup(true);
      return;
    }

    try {
      setIsLoading(true);

      // 1️⃣ Save pump fill record
      await addDoc(collection(db, "tankerFillOperationsPump"), {
        userId: auth.currentUser.uid,
        tankerId,
        product,
        totalPumpOil: capacity,
        oldOil: Number(oldOil),
        filledOil: Number(filledOil),
        finalOil: final,
        pumpName,
        driverName,
        dateReceived,
        createdAt: serverTimestamp(),
      });

      // 2️⃣ Update tanker remaining oil (RULE SAFE)
      const tankerQuery = query(
        collection(db, "tankers"),
        where("truckNumber", "==", tankerId)
      );

      const unsub = onSnapshot(tankerQuery, async (snap) => {
        if (!snap.empty) {
          const tankerDoc = snap.docs[0];
          await updateDoc(doc(db, "tankers", tankerDoc.id), {
            remainingOil: final,
            updatedAt: serverTimestamp(), // 🔥 REQUIRED BY YOUR RULES
          });
        }
        unsub(); // stop listener immediately
      });

      resetForm();
      alert("✅ Tanker filled & pump record saved!");

    } catch (error) {
      console.error("Submit error:", error);
      alert("❌ Save failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // if (isLoading && showRecordsOnly) {
  //   return <div className="loading-screen">🔄 Loading tanker details...</div>;
  // }

  return (
    <div className="truck-fill">
      {!showRecordsOnly && (
        <>
          <h3>⛽ Fill Tanker from Pump</h3>

          <div className="role-badge tanker">
            ✅ <strong>TANKER ID:</strong> <span className="locked">{tankerId}</span> |
            🚛 <strong>DRIVER:</strong>
            <span className={driverName ? "driver-found" : "driver-loading"}>
              {driverName || "Auto-searching..."}
            </span>
          </div>

          {isTankerAccess && (
            <form onSubmit={handleSubmit}>


              {/* <input type="text" value={tankerId} readOnly className="locked-field" /> */}
              <label>Tanker ID:</label>
              <input
                type="text"
                value={tankerId}
                onChange={(e) => canEdit && setTankerId(e.target.value)}
                readOnly={!canEdit}
                className={canEdit ? "" : "locked-field"}
                placeholder="Enter Tanker ID"
              />


              <div className="form-row-split">
                <div>
                  <label>Product:</label>
                  <input type="text" value={product} onChange={e => setProduct(e.target.value)} required />
                </div>
                <div>
                  <label>Capacity (L):</label>
                  <input type="number" value={totalPumpOil} readOnly className="auto-field" />
                </div>
              </div>

              <div className="form-row-split">
                <div>
                  <label>Remaining Oil (L):</label>
                  <input type="number" value={oldOil} readOnly className="auto-field" />
                </div>
                <div>
                  <label>New Fill (L):</label>
                  <input type="number" value={filledOil} onChange={e => setFilledOil(e.target.value)} required min="0" />
                </div>
              </div>

              <label className="final-oil-label">Final Oil:</label>
              <input type="number" value={finalOil} readOnly className="final-oil-field auto-field" />

              <div className="form-row-split">
                <div>
                  <label>Pump:</label>
                  <input type="text" value={pumpName} readOnly className="auto-field" />
                </div>
                <div>
                  <label>Driver:</label>
                  <input type="text" value={driverName} readOnly className="locked-field driver-locked" />
                </div>
              </div>

              <label>Date:</label>
              <input type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} required />

              <div className="form-actions">
                <button type="submit" disabled={isLoading}>
                  {isLoading ? "💾 Saving..." : "✅ Save Pump Record"}
                </button>
                <button type="button" onClick={() => { resetForm(); if (onClose) onClose(); }}>
                  ❌ Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}

      <div className="truck-table">
        <div className="table-header">
          <h4>⛽ Tanker Pump Records ({pumpRecords.length})</h4>
          <button
            className="print-btn"
            onClick={printAllRecords}
            disabled={pumpRecords.length === 0}
            title="Download PDF of all records"
          >
            🖨️ Print All
          </button>
        </div>

        {pumpRecords.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Capacity</th>
                <th>Old</th>
                <th>Filled</th>
                <th>Final</th>
                <th>Pump</th>
                <th>Driver</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pumpRecords.slice(0, 10).map(item => (
                <tr key={item.id}>
                  <td>{item.dateReceived}</td>
                  <td>{item.product}</td>
                  <td>{item.totalPumpOil}L</td>
                  <td>{item.oldOil || 0}L</td>
                  <td style={{ color: 'green' }}>{item.filledOil}L</td>
                  <td className="remaining-oil">{item.finalOil}L</td>
                  <td>{item.pumpName}</td>
                  <td>{item.driverName}</td>
                  <td>
                    <button
                      className="print-btn-small"
                      onClick={() => printSingleRecord(item)}
                      title="Print single record"
                    >
                      🖨️
                    </button>
                    {(canEdit || (item.userId === auth.currentUser?.uid)) && (
                      <>
                        <button className="edit-btn" onClick={() => setEditRecord(item)}>
                          ✏️
                        </button>
                        <button className="delete-btn" onClick={() => {
                          setDeleteRecordId(item.id);
                          setShowDeleteConfirm(true);
                        }}>
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>❌ No pump records found for <strong>{tankerId}</strong></p>
        )}
      </div>

      {editRecord && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditTruck
              record={editRecord}
              onCancel={() => setEditRecord(null)}
              onSave={() => {
                setEditRecord(null);
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}

      {showOverfillPopup && (
        <div className="overfill-popup">
          <div className="popup-content">
            <h4>⚠️ Overfill Warning!</h4>
            <p><strong>{finalOil}L</strong> exceeds <strong>{totalPumpOil}L</strong> capacity</p>
            <div className="popup-actions">
              <button onClick={() => setShowOverfillPopup(false)}>Fix It</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-popup">
          <div className="popup-content">
            <h4>🗑️ Confirm Delete</h4>
            <p>Delete this pump fill record permanently?</p>
            <div className="popup-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn-confirm" onClick={async () => {
                // await handleDelete(deleteRecordId);
                setShowDeleteConfirm(false);
              }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}