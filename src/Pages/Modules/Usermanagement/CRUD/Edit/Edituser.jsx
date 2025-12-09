// src/Pages/Modules/Usermanagement/CRUD/Edit/Edituser.jsx
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../../../../../firebase";  
import './Edituser.css';

export default function EditUserModal({ userData, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    LIC: '',
    MobNumber: '',
    assignedType: 'Tanker',   // default tanker
    assignedId: ''
  });

  const [vehicles, setVehicles] = useState([]);
  const [tankers, setTankers] = useState([]);

  // Pre-fill form with userData
  useEffect(() => {
    if (userData) {
      setFormData(userData);
    }
  }, [userData]);

  // Fetch trucks and tankers for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const trucksSnap = await getDocs(collection(db, "trucks"));
        const tankersSnap = await getDocs(collection(db, "tankers"));
        setVehicles(trucksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTankers(tankersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching IDs:", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userRef = doc(db, "users", formData.id);

      const selected =
        formData.assignedType === "Vehicle"
          ? vehicles.find(v => v.id === formData.assignedId)
          : tankers.find(t => t.id === formData.assignedId);

      // role always tanker
      const role = "Tanker";

      await updateDoc(userRef, {
        name: formData.name,
        email: formData.email,
        LIC: formData.LIC,
        MobNumber: formData.MobNumber,
        role: role,
        assignedType: formData.assignedType,
        assignedId: formData.assignedId,
        assignedTruckNumber: selected?.truckNumber || "",
        assignedTruckModel: selected?.model || ""
      });

      if (onUpdate) onUpdate(formData);
      onClose();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit User</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name || ""}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="LIC"
            placeholder="LIC Number"
            value={formData.LIC || ""}
            onChange={handleChange}
            required
            pattern="[A-Za-z0-9]{6,}"
            title="LIC number must be at least 6 alphanumeric characters"
          />
          <input
            type="text"
            name="MobNumber"
            placeholder="Mobile Number"
            value={formData.MobNumber || ""}
            onChange={handleChange}
            required
            pattern="\d{10}"
            title="Mobile number must be exactly 10 digits"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email || ""}
            onChange={handleChange}
            required
          />

          {/* Assigned Type Dropdown */}
          <select
            name="assignedType"
            value={formData.assignedType || "Tanker"}
            onChange={handleChange}
            required
          >
            <option value="Vehicle">Vehicle</option>
            <option value="Tanker">Tanker</option>
          </select>

          {/* Assigned ID Dropdown */}
          <select
            name="assignedId"
            value={formData.assignedId || ""}
            onChange={handleChange}
            required
          >
            <option value="">Select ID</option>
            {(formData.assignedType === "Vehicle" ? vehicles : tankers).map(item => (
              <option key={item.id} value={item.id}>
                {item.truckNumber} ({item.model})
              </option>
            ))}
          </select>

          <div className="modal-actions">
            <button type="submit">Update</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
