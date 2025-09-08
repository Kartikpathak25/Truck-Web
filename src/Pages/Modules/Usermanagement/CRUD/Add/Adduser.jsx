import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../../../../firebase";
import "./Adduser.css";

export default function AddUserModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    LIC: "",
    MobNumber: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "users"), {
        name: formData.name,
        email: formData.email,
        LIC: formData.LIC,
        MobNumber: formData.MobNumber,
        password: formData.password,
        initials: formData.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(), // JA type initials
      });

      alert("✅ User Added Successfully!");
      setFormData({
        name: "",
        email: "",
        LIC: "",
        MobNumber: "",
        password: "",
      });
      onClose(); // modal close karne ke liye
    } catch (error) {
      console.error("❌ Error adding user: ", error);
      alert("Failed to add user. Check console for details.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New User</h3>
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
            <button type="submit">Add User</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
