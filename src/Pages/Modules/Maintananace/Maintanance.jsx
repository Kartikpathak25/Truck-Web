// src/components/Maintanance/Maintanance.js
import React, { useState, useEffect } from "react";
import './maintananace.css';
import { useForm } from "react-hook-form";
import Sidebar from "../../../Component/Sidebar/Sidebar";

import {
  FaUser,
  FaCalendarAlt,
  FaTools,
  FaRupeeSign,
  FaSortAmountUp,
  FaClipboardList,
  FaTrash,
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

export default function Maintanance() {
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // DELETE POPUP STATE
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  // 🔥 FETCH DATA
  useEffect(() => {
    const fetchMaintenance = async () => {
      const snapshot = await getDocs(collection(db, "maintenance"));
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMaintenanceList(list);
    };
    fetchMaintenance();
  }, []);

  // 🔥 ADD / UPDATE
  const onSubmit = async (data) => {
    if (editIndex !== null) {
      // UPDATE
      const id = maintenanceList[editIndex].id;
      const ref = doc(db, "maintenance", id);
      await updateDoc(ref, data);

      const updatedList = [...maintenanceList];
      updatedList[editIndex] = { id, ...data };
      setMaintenanceList(updatedList);

      setEditIndex(null);
    } else {
      // ADD
      const ref = await addDoc(collection(db, "maintenance"), data);
      setMaintenanceList([...maintenanceList, { id: ref.id, ...data }]);
    }

    reset();
    setShowForm(false);
  };

  // EDIT
  const handleEdit = (index) => {
    const item = maintenanceList[index];
    Object.keys(item).forEach((key) => setValue(key, item[key]));
    setEditIndex(index);
    setShowForm(true);
  };

  // DELETE POPUP OPEN
  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setShowDeletePopup(true);
  };

  // DELETE CONFIRM
  const confirmDelete = async () => {
    const id = maintenanceList[deleteIndex].id;
    await deleteDoc(doc(db, "maintenance", id));

    const newList = maintenanceList.filter((_, i) => i !== deleteIndex);
    setMaintenanceList(newList);

    setShowDeletePopup(false);
  };

  const cancelDelete = () => setShowDeletePopup(false);

  // SEARCH
  const filteredList = maintenanceList.filter(
    (item) =>
      item.truckId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          placeholder="Search Truck ID or Driver Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* FORM MODAL */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-form">
              <h3>{editIndex !== null ? "Edit Maintenance" : "Add Maintenance"}</h3>

              <form onSubmit={handleSubmit(onSubmit)}>
                <input
                  type="text"
                  placeholder="Truck ID"
                  {...register("truckId", { required: "Truck ID required" })}
                />
                {errors.truckId && <p className="error">{errors.truckId.message}</p>}

                <input
                  type="text"
                  placeholder="Driver Name"
                  {...register("driverName", { required: "Driver required" })}
                />
                {errors.driverName && (
                  <p className="error">{errors.driverName.message}</p>
                )}

                <input type="date" {...register("date", { required: "Date required" })} />
                {errors.date && <p className="error">{errors.date.message}</p>}

                <input
                  type="text"
                  placeholder="Spare Part"
                  {...register("partName", { required: "Part required" })}
                />

                <input
                  type="number"
                  placeholder="Price (₹)"
                  {...register("price", { required: "Price required" })}
                />

                <input
                  type="number"
                  placeholder="Quantity"
                  {...register("quantity", { required: "Quantity required" })}
                />

                <input
                  type="number"
                  placeholder="Service Charge (₹)"
                  {...register("serviceCharge", { required: "Service Charge required" })}
                />

                <textarea placeholder="Notes" {...register("notes")} />

                <div className="form-actions">
                  <button type="submit">Save</button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowForm(false)}
                  >
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
                <button className="cancel-popup" onClick={cancelDelete}>
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
              <img
                src="https://source.unsplash.com/400x200/?truck,garage"
                className="card-image"
              />

              <div className="card-content">
                <h3>{item.truckId}</h3>

                <p>
                  <FaUser /> <strong>Driver:</strong> {item.driverName}
                </p>
                <p>
                  <FaCalendarAlt /> <strong>Date:</strong> {item.date}
                </p>
                <p>
                  <FaTools /> <strong>Parts:</strong> {item.partName}
                </p>
                <p>
                  <FaRupeeSign /> <strong>Price:</strong> ₹{item.price}
                </p>
                <p>
                  <FaSortAmountUp /> <strong>Qty:</strong> {item.quantity}
                </p>
                <p>
                  <FaRupeeSign /> <strong>Service:</strong> ₹{item.serviceCharge}
                </p>
                <p>
                  <FaClipboardList /> <strong>Notes:</strong> {item.notes}
                </p>

                {/* BUTTON ROW */}
                <div className="card-buttons">
                  <button className="edit-btn" onClick={() => handleEdit(index)}>
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteClick(index)}
                  >
                    <FaTrash /> Delete
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
