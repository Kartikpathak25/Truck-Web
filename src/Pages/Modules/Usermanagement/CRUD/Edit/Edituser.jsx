import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../firebase";  // sahi path check kar lena
import './Edituser.css';

export default function EditUserModal({ userData, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    LIC: '',
    MobNumber: '',
    password: '',
  });

  useEffect(() => {
    if (userData) {
      setFormData(userData); // userData me id bhi pass karna
    }
  }, [userData]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userRef = doc(db, "users", formData.id); // id required hai
      await updateDoc(userRef, {
        name: formData.name,
        email: formData.email,
        LIC: formData.LIC,
        MobNumber: formData.MobNumber,
        password: formData.password,
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
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="LIC"
            placeholder="LIC Number"
            value={formData.LIC}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="MobNumber"
            placeholder="Mobile Number"
            value={formData.MobNumber}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <div className="modal-actions">
            <button type="submit">Update</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
