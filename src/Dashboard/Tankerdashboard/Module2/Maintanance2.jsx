// src/components/Maintanance/Maintanance2.js
import React, { useState, useEffect } from "react";
import "./Maintanance2.css";
import { useForm } from "react-hook-form";
import Sidebar from "../../../Component/Sidebar/Sidebar2/Sidebar2";

import {
  FaUser,
  FaCalendarAlt,
  FaTools,
  FaRupeeSign,
  FaClipboardList,
  FaTrash,
  FaPrint,
  FaWrench,
  FaTruck,
} from "react-icons/fa";

import { db } from "../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Maintanance2() {
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userVehicle, setUserVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  // 👀 watch price & serviceCharge for auto total
  const watchPrice = watch("price");
  const watchServiceCharge = watch("serviceCharge");

  // 🔥 Get logged user from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("loggedUser");
    if (stored) {
      const u = JSON.parse(stored);
      if (u.assignedTruckNumber) {
        setUserVehicle({
          truckNumber: u.assignedTruckNumber,
          vehicleModel: u.assignedTruckModel,
          driverName: u.driverName || u.name || "",
        });
      }
    }
  }, []);

  // 🔥 FETCH MAINTENANCE DATA
  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const snapshot = await getDocs(collection(db, "maintenance"));
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMaintenanceList(list);
      } catch (error) {
        console.error("Error fetching maintenance:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaintenance();
  }, []);

  // 🧮 Auto-calc totalPrice = price + serviceCharge
  useEffect(() => {
    const p = parseFloat(watchPrice || 0);
    const s = parseFloat(watchServiceCharge || 0);
    const total = p + s;
    if (!isNaN(total)) setValue("totalPrice", Number(total.toFixed(2)));
  }, [watchPrice, watchServiceCharge, setValue]);

  const openAddForm = () => {
    reset();
    setEditIndex(null);

    if (userVehicle) {
      setValue("truckNumber", userVehicle.truckNumber);
      setValue("vehicleModel", userVehicle.vehicleModel);
      setValue("driverName", userVehicle.driverName);
    }

    setShowForm(true);
  };

  const onSubmit = async (data) => {
    try {
      if (userVehicle) {
        data.truckNumber = userVehicle.truckNumber;
        data.vehicleModel = userVehicle.vehicleModel;
        data.driverName = userVehicle.driverName;
      }

      if (editIndex !== null) {
        const id = maintenanceList[editIndex].id;
        const ref = doc(db, "maintenance", id);
        await updateDoc(ref, data);

        const updated = [...maintenanceList];
        updated[editIndex] = { id, ...data };
        setMaintenanceList(updated);
        setEditIndex(null);
      } else {
        const ref = await addDoc(collection(db, "maintenance"), data);
        setMaintenanceList([...maintenanceList, { id: ref.id, ...data }]);
      }
      reset();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving maintenance:", error);
      alert("Failed to save maintenance record");
    }
  };

  const handleEdit = (index) => {
    const item = maintenanceList[index];
    Object.keys(item).forEach((key) => setValue(key, item[key]));
    setEditIndex(index);
    setShowForm(true);
  };

  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    try {
      const id = maintenanceList[deleteIndex].id;
      await deleteDoc(doc(db, "maintenance", id));
      setMaintenanceList((prev) => prev.filter((_, i) => i !== deleteIndex));
    } catch (error) {
      console.error("Error deleting maintenance:", error);
      alert("Failed to delete record");
    } finally {
      setShowDeletePopup(false);
    }
  };

  const filteredList = maintenanceList.filter((item) => {
    if (!userVehicle) return false;
    const sameTruck =
      (item.truckNumber || "").toLowerCase() ===
      userVehicle.truckNumber.toLowerCase();

    if (!sameTruck) return false;

    const term = searchTerm.toLowerCase();
    return (
      item.truckNumber?.toLowerCase().includes(term) ||
      item.driverName?.toLowerCase().includes(term) ||
      item.vehicleModel?.toLowerCase().includes(term)
    );
  });

  const handlePrintCard = (item) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(15);
    pdf.text("Truck Maintenance Record", pageWidth / 2, 15, {
      align: "center",
    });

    autoTable(pdf, {
      startY: 25,
      head: [["Field", "Value"]],
      body: [
        ["Truck Number", item.truckNumber],
        ["Vehicle Model", item.vehicleModel || "N/A"],
        ["Driver Name", item.driverName],
        ["Date", item.date],
        ["Spare Part", item.partName],
        ["Price (₹)", item.price],
        ["Service Charge (₹)", item.serviceCharge],
        ["Total (₹)", item.totalPrice],
        ["Notes", item.notes],
      ],
      styles: { fontSize: 11, cellPadding: 3 },
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      margin: { left: 10, right: 10 },
    });

    pdf.save(`maintenance-${item.truckNumber}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="maintenance-layout">
        <Sidebar />
        <div className="maintenance-content">
          <p style={{ textAlign: "center", padding: "40px" }}>
            Loading maintenance data...
          </p>
        </div>
      </div>
    );
  }

  if (!userVehicle) {
    return (
      <div className="maintenance-layout">
        <Sidebar />
        <div className="maintenance-content">
          <p style={{ textAlign: "center", padding: "40px", color: "#d9534f" }}>
            No vehicle assigned to this user. Please contact admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="maintenance-layout">
      <Sidebar />

      <div className="maintenance-content">
        <div className="maintenance-header">
          <div>
            <h2>🔧 Truck Maintenance</h2>
            <p style={{ color: "#666", marginTop: "5px", fontSize: "14px" }}>
              Vehicle: <strong>{userVehicle.truckNumber}</strong> | Model:{" "}
              <strong>{userVehicle.vehicleModel}</strong> | Driver:{" "}
              <strong>{userVehicle.driverName}</strong>
            </p>
          </div>
          <button className="add-btn" onClick={openAddForm}>
            + Add Maintenance
          </button>
        </div>

        <input
          type="text"
          className="search-bar"
          placeholder="Search Truck Number, Vehicle Model or Driver Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* ------------ FORM MODAL ------------ */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-form">
              <h3>
                {editIndex !== null ? "Edit Maintenance" : "Add Maintenance"}
              </h3>

              <form onSubmit={handleSubmit(onSubmit)}>
                <input
                  type="text"
                  placeholder="Truck Number"
                  {...register("truckNumber")}
                  readOnly
                  style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
                />

                <input
                  type="text"
                  placeholder="Vehicle Model"
                  {...register("vehicleModel")}
                  readOnly
                  style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
                />

                <input
                  type="text"
                  placeholder="Driver Name"
                  {...register("driverName")}
                  readOnly
                  style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
                />

                <input
                  type="date"
                  {...register("date", { required: "Date required" })}
                />
                {errors.date && (
                  <p className="error">{errors.date.message}</p>
                )}

                <input
                  type="text"
                  placeholder="Spare Part Name"
                  {...register("partName", { required: "Part required" })}
                />
                {errors.partName && (
                  <p className="error">{errors.partName.message}</p>
                )}

                {/* PRICE */}
                <input
                  type="number"
                  placeholder="Price (₹)"
                  {...register("price", { required: "Price required" })}
                />
                {errors.price && (
                  <p className="error">{errors.price.message}</p>
                )}

                {/* SERVICE CHARGE */}
                <input
                  type="number"
                  placeholder="Service Charge (₹)"
                  {...register("serviceCharge", {
                    required: "Service charge required",
                  })}
                />
                {errors.serviceCharge && (
                  <p className="error">{errors.serviceCharge.message}</p>
                )}

                {/* AUTO TOTAL (READ ONLY) */}
                <input
                  type="number"
                  placeholder="Total (₹)"
                  {...register("totalPrice")}
                  readOnly
                  style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
                />

                <textarea
                  placeholder="Notes / Additional Details"
                  {...register("notes")}
                />

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    Save Maintenance
                  </button>
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

        {/* ------------ DELETE POPUP ------------ */}
        {showDeletePopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <h3>⚠️ Delete Record?</h3>
              <p>This action cannot be undone.</p>

              <div className="popup-buttons">
                <button className="delete-confirm" onClick={confirmDelete}>
                  Delete
                </button>
                <button
                  className="cancel-popup"
                  onClick={() => setShowDeletePopup(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------ CARD LIST ------------ */}
        <div className="maintenance-list">
          {filteredList.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999", padding: "40px" }}>
              No maintenance records found. Click "+ Add Maintenance" to create
              one.
            </p>
          ) : (
            filteredList.map((item, index) => (
              <div key={item.id} className="maintenance-card">
                <div className="card-icon">
                  <FaWrench />
                </div>

                <div className="card-content">
                  <h3>
                    <FaTruck /> {item.truckNumber}
                  </h3>

                  <p>
                    <strong>Vehicle Model:</strong> {item.vehicleModel || "N/A"}
                  </p>

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
                    <FaRupeeSign /> <strong>Service Charge:</strong> ₹
                    {item.serviceCharge}
                  </p>
                  <p>
                    <FaRupeeSign /> <strong>Total:</strong> ₹{item.totalPrice}
                  </p>
                  <p>
                    <FaClipboardList /> <strong>Notes:</strong> {item.notes}
                  </p>

                  <div className="card-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(index)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteClick(index)}
                    >
                      <FaTrash /> Delete
                    </button>

                    <button
                      className="print-btn"
                      onClick={() => handlePrintCard(item)}
                    >
                      <FaPrint /> Print
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
