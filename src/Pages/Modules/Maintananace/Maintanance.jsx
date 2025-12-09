// src/components/Maintanance/Maintanance.js
import React, { useState, useEffect } from "react";
import "./maintananace.css";
import { useForm } from "react-hook-form";
import Sidebar from "../../../Component/Sidebar/Sidebar";

import {
  FaUser,
  FaCalendarAlt,
  FaTools,
  FaRupeeSign,
  FaClipboardList,
  FaTrash,
  FaPrint,
  FaWrench,
} from "react-icons/fa";

// FIREBASE
import { db } from "../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Maintanance() {
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [truckOptions, setTruckOptions] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  // Auto Total Calculator
  const calculateTotal = (price, service) => {
    const p = parseFloat(price) || 0;
    const s = parseFloat(service) || 0;
    setTotalPrice(p + s);
  };

  // Fetch Maintenance Data
  useEffect(() => {
    const fetchMaintenance = async () => {
      const snapshot = await getDocs(collection(db, "maintenance"));
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMaintenanceList(list);
    };
    fetchMaintenance();
  }, []);

  // Fetch Trucks
  useEffect(() => {
    const fetchTrucks = async () => {
      const snapshot = await getDocs(collection(db, "trucks"));
      setTruckOptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchTrucks();
  }, []);

  // ADD / UPDATE Submit
  const onSubmit = async (data) => {
    data.totalPrice = totalPrice; // add total

    if (editIndex !== null) {
      const id = maintenanceList[editIndex].id;
      await updateDoc(doc(db, "maintenance", id), data);

      let updated = [...maintenanceList];
      updated[editIndex] = { id, ...data };
      setMaintenanceList(updated);
      setEditIndex(null);
    } else {
      const ref = await addDoc(collection(db, "maintenance"), data);
      setMaintenanceList([...maintenanceList, { id: ref.id, ...data }]);
    }

    reset();
    setTotalPrice(0);
    setShowForm(false);
  };

  const handleEdit = async (index) => {
    const item = maintenanceList[index];
    Object.keys(item).forEach((key) => setValue(key, item[key]));
    setTotalPrice(item.totalPrice || 0);
    setEditIndex(index);
    setShowForm(true);
  };

  // Delete
  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    const id = maintenanceList[deleteIndex].id;
    await deleteDoc(doc(db, "maintenance", id));
    setMaintenanceList(maintenanceList.filter((_, i) => i !== deleteIndex));
    setShowDeletePopup(false);
  };

  const filteredList = maintenanceList.filter(
    (item) =>
      item.truckId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // PDF Print
  const handlePrintCard = (item) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(15);
    doc.text("Truck Maintenance Record", pageWidth / 2, 15, { align: "center" });

    autoTable(doc, {
      startY: 25,
      head: [["Field", "Value"]],
      body: [
        ["Truck ID", item.truckId],
        ["Driver", item.driverName],
        ["Date", item.date],
        ["Part", item.partName],
        ["Price", item.price],
        ["Service Charge", item.serviceCharge],
        ["Total Price", item.totalPrice],
        ["Notes", item.notes],
      ],
    });

    doc.save(`maintenance-${item.truckId}.pdf`);
  };

  const handleTruckSelect = (truckNumber) => {
    setValue("truckId", truckNumber);
    const selectedTruck = truckOptions.find(t => t.truckNumber === truckNumber);
    if (selectedTruck) {
      setValue("driverName", selectedTruck.driverName || "");
    }
  };

  return (
    <div className="maintenance-layout">
      <Sidebar />

      <div className="maintenance-content">
        <div className="maintenance-header">
          <h2>Truck Maintenance</h2>
          <button className="add-btn" onClick={() => setShowForm(true)}>
            + Add Maintenance
          </button>
        </div>

        <input
          type="text"
          className="search-bar"
          placeholder="Search Truck ID or Driver Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* FORM MODAL */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-form">
              <h3>{editIndex !== null ? "Edit Maintenance" : "Add Maintenance"}</h3>

              <form onSubmit={handleSubmit(onSubmit)}>
                
                {/* Truck ID */}
                <label>Truck ID:</label>
                <select
                  {...register("truckId", { required: true })}
                  onChange={(e) => handleTruckSelect(e.target.value)}
                >
                  <option value="">Select Truck</option>
                  {truckOptions.map((truck, i) => (
                    <option key={i} value={truck.truckNumber}>
                      {truck.truckNumber}
                    </option>
                  ))}
                </select>

                {/* Driver */}
                <label>Driver Name:</label>
                <input type="text" {...register("driverName")} readOnly />

                {/* Date */}
                <input type="date" {...register("date", { required: true })} />

                {/* Part */}
                <input
                  type="text"
                  placeholder="Spare Part"
                  {...register("partName", { required: true })}
                />

                {/* Price */}
                <input
                  type="number"
                  placeholder="Price (₹)"
                  {...register("price", { required: true })}
                  onChange={(e) => {
                    setValue("price", e.target.value);
                    calculateTotal(e.target.value, document.querySelector("input[name='serviceCharge']").value);
                  }}
                />

                {/* Service Charge */}
                <input
                  type="number"
                  name="serviceCharge"
                  placeholder="Service Charge (₹)"
                  {...register("serviceCharge", { required: true })}
                  onChange={(e) => {
                    setValue("serviceCharge", e.target.value);
                    calculateTotal(document.querySelector("input[name='price']").value, e.target.value);
                  }}
                />

                {/* TOTAL PRICE */}
                <label>Total Price (Auto):</label>
                <input
                  type="number"
                  value={totalPrice}
                  readOnly
                  style={{ background: "#eee", fontWeight: "bold" }}
                />

                {/* Notes */}
                <textarea placeholder="Notes" {...register("notes")} />

                <div className="form-actions">
                  <button type="submit">Save</button>
                  <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE POPUP */}
        {showDeletePopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <h3>Delete Record?</h3>
              <p>This action cannot be undone.</p>
              <div className="popup-buttons">
                <button className="delete-confirm" onClick={confirmDelete}>
                  Delete
                </button>
                <button className="cancel-popup" onClick={() => setShowDeletePopup(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CARD LIST */}
        <div className="maintenance-list">
          {filteredList.map((item, index) => (
            <div key={item.id} className="maintenance-card">
              <div className="card-icon">
                <FaWrench />
              </div>

              <div className="card-content">
                <h3>{item.truckId}</h3>
                <p><FaUser /> <strong>Driver:</strong> {item.driverName}</p>
                <p><FaCalendarAlt /> <strong>Date:</strong> {item.date}</p>
                <p><FaTools /> <strong>Part:</strong> {item.partName}</p>
                <p><FaRupeeSign /> <strong>Price:</strong> ₹{item.price}</p>
                <p><FaRupeeSign /> <strong>Service:</strong> ₹{item.serviceCharge}</p>

                {/* 🔥 Show Total Price */}
                <p><FaRupeeSign /> <strong>Total:</strong> ₹{item.totalPrice}</p>

                <p><FaClipboardList /> <strong>Notes:</strong> {item.notes}</p>

                <div className="card-actions">
                  <button className="edit-btn" onClick={() => handleEdit(index)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDeleteClick(index)}>
                    <FaTrash /> Delete
                  </button>
                  <button className="print-btn" onClick={() => handlePrintCard(item)}>
                    <FaPrint /> Print
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
