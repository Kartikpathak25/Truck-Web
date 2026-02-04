// src/components/Maintanance/Maintanance2.js
import { getAuth } from "firebase/auth";
import React, { useState, useEffect } from "react";
import "./Maintanance2.css";
import { useForm } from "react-hook-form";
import Sidebar from "../../../Component/Sidebar/Sidebar2/Sidebar2";

import {
  FaUser,
  FaCalendarAlt,
  FaTools,
  FaRupeeSign,
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
  query,
  where,
  getDoc,
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm();

  const watchPrice = watch("price");
  const watchServiceCharge = watch("serviceCharge");

  /* ================= FETCH USER ROLE ================= */
  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setRole(snap.data().role); // "Admin" or "Tanker"
      }
    };

    fetchRole();
  }, [auth]);

  /* ================= FETCH MAINTENANCE ================= */
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

  /* ================= AUTO TOTAL ================= */
  useEffect(() => {
    const total =
      Number(watchPrice || 0) + Number(watchServiceCharge || 0);
    setValue("totalPrice", total.toFixed(2));
  }, [watchPrice, watchServiceCharge, setValue]);

  /* ================= ADD / UPDATE ================= */
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
      };

      if (editingDocId) {
        await updateDoc(doc(db, "maintenance", editingDocId), submitData);
        setMaintenanceList((prev) =>
          prev.map((i) =>
            i.id === editingDocId ? { ...i, ...submitData } : i
          )
        );
      } else {
        const ref = await addDoc(collection(db, "maintenance"), submitData);
        setMaintenanceList((prev) => [...prev, { id: ref.id, ...submitData }]);
      }

      reset();
      setShowForm(false);
      setEditingDocId(null);
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (item) => {
    setEditingDocId(item.id);
    reset(item);
    setShowForm(true);
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;

    await deleteDoc(doc(db, "maintenance", id));
    setMaintenanceList((prev) => prev.filter((i) => i.id !== id));
  };

  /* ================= SEARCH ================= */
  const displayList = maintenanceList.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.truckNumber || "").toLowerCase().includes(term) ||
      (item.driverName || "").toLowerCase().includes(term) ||
      (item.vehicleModel || "").toLowerCase().includes(term) ||
      (item.partName || "").toLowerCase().includes(term)
    );
  });

  /* ================= PRINT ================= */
  const handlePrintCard = (item) => {
    const pdf = new jsPDF();
    pdf.text("Truck Maintenance Record", 65, 15);

    autoTable(pdf, {
      startY: 25,
      head: [["Field", "Value"]],
      body: [
        ["Truck", item.truckNumber],
        ["Driver", item.driverName],
        ["Date", item.date],
        ["Part", item.partName],
        ["Total", `₹${item.totalPrice}`],
      ],
    });

    pdf.save(`maintenance-${item.truckNumber}.pdf`);
  };

  /* ================= UI ================= */
  if (isLoading) {
    return (
      <div className="maintenance-layout">
        <Sidebar />
        <p style={{ padding: 40 }}>Loading maintenance...</p>
      </div>
    );
  }

  return (
    <div className="maintenance-layout">
      <Sidebar />

      <div className="maintenance-content">
        <div className="maintenance-header">
          <h2>🔧 Truck Maintenance</h2>
          <button className="add-btn" onClick={() => setShowForm(true)}>
            + Add Maintenance
          </button>
        </div>

        <input
          className="search-bar"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* FORM */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-form">
              <form onSubmit={handleSubmit(onSubmit)}>
                <input {...register("truckNumber")} placeholder="Truck No" />
                <input {...register("vehicleModel")} placeholder="Model" />
                <input {...register("driverName")} placeholder="Driver" />
                <input type="date" {...register("date")} />
                <input {...register("partName")} placeholder="Spare Part" />
                <input type="number" {...register("price")} placeholder="Price" />
                <input
                  type="number"
                  {...register("serviceCharge")}
                  placeholder="Service Charge"
                />
                <input {...register("totalPrice")} readOnly />
                <textarea {...register("notes")} placeholder="Notes" />

                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}

        {/* LIST */}
        <div className="maintenance-list">
          {displayList.map((item) => (
            <div key={item.id} className="maintenance-card">
              <div className="card-icon"><FaWrench /></div>

              <div className="card-content">
                <h3><FaTruck /> {item.truckNumber}</h3>
                <p><FaUser /> {item.driverName}</p>
                <p><FaCalendarAlt /> {item.date}</p>
                <p><FaTools /> {item.partName}</p>
                <p><FaRupeeSign /> ₹{item.totalPrice}</p>

                <div className="card-actions">
                  <button onClick={() => handleEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)}>
                    <FaTrash />
                  </button>
                  <button onClick={() => handlePrintCard(item)}>
                    <FaPrint />
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
