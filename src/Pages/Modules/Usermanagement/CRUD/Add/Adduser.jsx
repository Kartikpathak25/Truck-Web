import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../../../../firebase";
import "./Adduser.css";

export default function AddUserModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    LIC: "",
    MobNumber: "",
    password: "",
    assignedType: "Tanker",   // default tanker
    assignedId: "",
  });

  const [vehicles, setVehicles] = useState([]);
  const [tankers, setTankers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const trucksSnap = await getDocs(collection(db, "trucks"));
      const tankersSnap = await getDocs(collection(db, "tankers"));
      setVehicles(trucksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTankers(tankersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      const selected =
        formData.assignedType === "Vehicle"
          ? vehicles.find(v => v.id === formData.assignedId)
          : tankers.find(t => t.id === formData.assignedId);

      // role always tanker
      const role = "Tanker";

      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        LIC: formData.LIC,
        MobNumber: formData.MobNumber,
        role: role,
        assignedType: formData.assignedType,
        assignedId: formData.assignedId,
        assignedTruckNumber: selected?.truckNumber || "",
        assignedTruckModel: selected?.model || "",
        initials: formData.name.split(" ").map(n => n[0]).join("").toUpperCase(),
        createdAt: new Date(),
      });

      alert("✅ User Created Successfully!");
      onClose();
    } catch (error) {
      console.error("❌ Error creating user:", error);
      alert("Failed to create user. " + error.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New User</h3>
        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
          <input name="LIC" placeholder="LIC Number" value={formData.LIC} onChange={handleChange} required pattern="[A-Za-z0-9]{6,}" title="LIC number must be at least 6 alphanumeric characters" />
          <input name="MobNumber" placeholder="Mobile Number" value={formData.MobNumber} onChange={handleChange} required pattern="\d{10}" title="Mobile number must be exactly 10 digits" />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />

          <select name="assignedType" value={formData.assignedType} onChange={handleChange} required>
            <option value="Vehicle">Vehicle</option>
            <option value="Tanker">Tanker</option>
          </select>

          <select name="assignedId" value={formData.assignedId} onChange={handleChange} required>
            <option value="">Select ID</option>
            {(formData.assignedType === "Vehicle" ? vehicles : tankers).map(item => (
              <option key={item.id} value={item.id}>
                {item.truckNumber} ({item.model})
              </option>
            ))}
          </select>

          <div className="modal-actions">
            <button type="submit">Add User</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
