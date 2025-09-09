import React, { useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../../../../firebase"; // 👈 ensure correct path
import "./Adduser.css";

export default function AddUserModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    LIC: "",
    MobNumber: "",
    password: "",
    role: "Tanker", // default role
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 🔹 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 🔹 2. Save user details in Firestore with UID
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        LIC: formData.LIC,
        MobNumber: formData.MobNumber,
        role: formData.role,
        initials: formData.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
        createdAt: new Date(),
      });

      alert("✅ User Created Successfully!");
      setFormData({
        name: "",
        email: "",
        LIC: "",
        MobNumber: "",
        password: "",
        role: "Tanker",
      });
      onClose();
    } catch (error) {
      console.error("❌ Error creating user: ", error);
      alert("Failed to create user. " + error.message);
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

          {/* 🔹 Role Dropdown */}
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="Tanker">Tanker</option>
            <option value="Admin">Admin</option>
          </select>

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
