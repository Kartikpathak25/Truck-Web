// src/Dashboard/Tankerdashboard/Module2/Maintanance2.jsx
import { getAuth } from "firebase/auth";
import React, { useState, useEffect } from "react";
import "./Maintanance2.css";
import { useForm } from "react-hook-form";
import Sidebar2 from "../../../Component/Sidebar/Sidebar2/Sidebar2";

import {
  FaUser,
  FaCalendarAlt,
  FaTools,
  FaRupeeSign,
  FaTrash,
  FaPrint,
  FaWrench,
  FaTruck,
  FaEdit,
} from "react-icons/fa";

import { db } from "../../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Maintanance2() {
  const auth = getAuth();

  const [maintenanceList, setMaintenanceList] = useState([]);
  const [role, setRole] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [truckNumberInput, setTruckNumberInput] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm();

  const watchPrice = watch("price");
  const watchServiceCharge = watch("serviceCharge");
  const watchTruckNumber = watch("truckNumber");

  // Fetch user role
  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setRole(snap.data().role);
      }
    };

    fetchRole();
  }, [auth]);

  // Auto-fill truck number from user credentials
  useEffect(() => {
    const autoFillUserVehicle = async () => {
      const user = JSON.parse(localStorage.getItem("loggedUser"));
      if (user && !editingDocId) {
        const assignedTruck = user.assignedTruckNumber || user.tankerId || user.assignedId || user.LIC;
        if (assignedTruck) {
          setValue("truckNumber", assignedTruck);
          setTruckNumberInput(assignedTruck);
        }
      }
    };

    if (showForm) {
      autoFillUserVehicle();
    }
  }, [showForm, setValue, editingDocId]);

  // Auto-fetch vehicle details when truck number changes
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      if (!watchTruckNumber) return;

      try {
        // Try tankers collection first
        let q = query(
          collection(db, "tankers"),
          where("truckNumber", "==", watchTruckNumber)
        );
        let snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const vehicle = snapshot.docs[0].data();
          setValue("vehicleModel", vehicle.model || vehicle.vehicleModel || "");
          setValue("driverName", vehicle.driverName || "");
          return;
        }

        // Try trucks collection
        q = query(
          collection(db, "trucks"),
          where("truckNumber", "==", watchTruckNumber)
        );
        snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const vehicle = snapshot.docs[0].data();
          setValue("vehicleModel", vehicle.model || vehicle.vehicleModel || "");
          setValue("driverName", vehicle.driverName || "");
        }
      } catch (error) {
        console.error("Error fetching vehicle details:", error);
      }
    };

    fetchVehicleDetails();
  }, [watchTruckNumber, setValue]);

  // Fetch maintenance records
  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        let q;

        if (role === "Admin") {
          q = query(collection(db, "maintenance"));
        } else {
          q = query(
            collection(db, "maintenance"),
            where("userId", "==", user.uid)
          );
        }

        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setMaintenanceList(list);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (role) fetchMaintenance();
  }, [role, auth]);

  // Auto-calculate total
  useEffect(() => {
    const total = Number(watchPrice || 0) + Number(watchServiceCharge || 0);
    setValue("totalPrice", total.toFixed(2));
  }, [watchPrice, watchServiceCharge, setValue]);

  const onSubmit = async (data) => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("Login required");

      const submitData = {
        ...data,
        userId: user.uid,
        price: Number(data.price),
        serviceCharge: Number(data.serviceCharge),
        totalPrice: Number(data.totalPrice),
        createdAt: serverTimestamp(),
      };

      if (editingDocId) {
        await updateDoc(doc(db, "maintenance", editingDocId), {
          ...submitData,
          updatedAt: serverTimestamp(),
        });
        setMaintenanceList((prev) =>
          prev.map((i) =>
            i.id === editingDocId ? { ...i, ...submitData } : i
          )
        );
        alert("✅ Maintenance record updated successfully!");
      } else {
        const ref = await addDoc(collection(db, "maintenance"), submitData);
        setMaintenanceList((prev) => [...prev, { id: ref.id, ...submitData }]);
        alert("✅ Maintenance record added successfully!");
      }

      reset();
      setShowForm(false);
      setEditingDocId(null);
      setTruckNumberInput("");
    } catch (err) {
      console.error(err);
      alert("❌ Save failed: " + err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingDocId(item.id);
    reset(item);
    setTruckNumberInput(item.truckNumber);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      await deleteDoc(doc(db, "maintenance", id));
      setMaintenanceList((prev) => prev.filter((i) => i.id !== id));
      alert("✅ Record deleted successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Delete failed");
    }
  };

  const displayList = maintenanceList.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.truckNumber || "").toLowerCase().includes(term) ||
      (item.driverName || "").toLowerCase().includes(term) ||
      (item.vehicleModel || "").toLowerCase().includes(term) ||
      (item.partName || "").toLowerCase().includes(term)
    );
  });

  const handlePrintCard = (item) => {
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Truck Maintenance Record", 65, 15);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

    autoTable(pdf, {
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Truck Number", item.truckNumber || "N/A"],
        ["Vehicle Model", item.vehicleModel || "N/A"],
        ["Driver Name", item.driverName || "N/A"],
        ["Date", item.date || "N/A"],
        ["Spare Part", item.partName || "N/A"],
        ["Price", `₹${item.price || 0}`],
        ["Service Charge", `₹${item.serviceCharge || 0}`],
        ["Total Price", `₹${item.totalPrice || 0}`],
        ["Notes", item.notes || "N/A"],
      ],
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] },
    });

    pdf.save(`maintenance-${item.truckNumber}-${new Date().getTime()}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="maintenance-layout">
        <Sidebar2 />
        <div className="maintenance-content">
          <div className="loading-screen">
            🔄 Loading maintenance records...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="maintenance-layout">
      <Sidebar2 />

      <div className="maintenance-content">
        <div className="maintenance-header">
          <h2>🔧 Truck Maintenance</h2>
          <button className="add-btn" onClick={() => setShowForm(true)}>
            + Add Maintenance
          </button>
        </div>

        <input
          className="search-bar"
          placeholder="🔍 Search by truck number, driver, model, or part name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {showForm && (
          <div className="modal-overlay" onClick={() => {
            setShowForm(false);
            setEditingDocId(null);
            setTruckNumberInput("");
            reset();
          }}>
            <div className="modal-form" onClick={(e) => e.stopPropagation()}>
              <h3>{editingDocId ? "✏️ Edit Maintenance" : "➕ Add New Maintenance"}</h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <label>Truck / Tanker Number *</label>
                <input
                  {...register("truckNumber", { required: true })}
                  placeholder="Enter Truck/Tanker Number"
                  className="locked-field"
                />

                <label>Vehicle Model</label>
                <input
                  {...register("vehicleModel")}
                  placeholder="Auto-filled from vehicle data"
                  className="auto-field"
                  readOnly
                />

                <label>Driver Name</label>
                <input
                  {...register("driverName", { required: true })}
                  placeholder="Auto-filled from vehicle data"
                  className="auto-field"
                  readOnly
                />

                <label>Date *</label>
                <input
                  type="date"
                  {...register("date", { required: true })}
                />

                <label>Spare Part Name *</label>
                <input
                  {...register("partName", { required: true })}
                  placeholder="Enter spare part name"
                />

                <label>Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("price", { required: true })}
                  placeholder="0.00"
                />

                <label>Service Charge (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("serviceCharge")}
                  placeholder="0.00"
                />

                <label>Total Price (₹)</label>
                <input
                  {...register("totalPrice")}
                  placeholder="Auto-calculated"
                  readOnly
                  className="auto-field"
                />

                <label>Additional Notes (optional)</label>
                <textarea
                  {...register("notes")}
                  placeholder="Enter any additional notes..."
                  rows="3"
                />

                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    {editingDocId ? "✅ Update" : "💾 Save"}
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowForm(false);
                      setEditingDocId(null);
                      setTruckNumberInput("");
                      reset();
                    }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {displayList.length === 0 ? (
          <div className="empty-state">
            <FaWrench className="empty-icon" />
            <h3>No maintenance records found</h3>
            <p>Click "Add Maintenance" to create your first record</p>
          </div>
        ) : (
          <div className="maintenance-list">
            {displayList.map((item) => (
              <div key={item.id} className="maintenance-card">
                <div className="card-icon">
                  <FaWrench />
                </div>

                <div className="card-content">
                  <h3>
                    <FaTruck /> {item.truckNumber}
                  </h3>
                  <p>
                    <strong>Model:</strong> {item.vehicleModel || "N/A"}
                  </p>
                  <p>
                    <FaUser /> <strong>Driver:</strong> {item.driverName}
                  </p>
                  <p>
                    <FaCalendarAlt /> <strong>Date:</strong> {item.date}
                  </p>
                  <p>
                    <FaTools /> <strong>Part:</strong> {item.partName}
                  </p>
                  <p>
                    <FaRupeeSign /> <strong>Total:</strong>
                    <span className="value-pill">₹{item.totalPrice}</span>
                  </p>
                  {item.notes && (
                    <p className="notes-text">
                      📝 {item.notes}
                    </p>
                  )}

                  <div className="card-actions">
                    <button className="edit-btn" onClick={() => handleEdit(item)}>
                      <FaEdit /> Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(item.id)}>
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
        )}
      </div>
    </div>
  );
}