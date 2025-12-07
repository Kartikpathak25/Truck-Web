import React, { useState } from 'react';
import './AddTruck.css';
import { db } from "../../../../../firebase";
import { collection, addDoc } from 'firebase/firestore';

export default function AddTruck({ onClose }) {
  const [formData, setFormData] = useState({
    truckNumber: '',
    model: '',
    location: '',
    capacity: '',
    driverName: '',   // ✅ Added driver name
    status: 'Active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // prevent double submit

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'trucks'), formData);
      onClose(); // close modal
      setFormData({
        truckNumber: '',
        model: '',
        location: '',
        capacity: '',
        driverName: '',   // ✅ reset driver name
        status: 'Active'
      });
    } catch (error) {
      console.error('Error adding truck:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-truck-form-container">
      <h2>Add New Truck</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="truckNumber"
          placeholder="Truck Number"
          value={formData.truckNumber}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="model"
          placeholder="Model"
          value={formData.model}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="capacity"
          placeholder="Capacity"
          value={formData.capacity}
          onChange={handleChange}
          required
        />

        {/* ✅ New Driver Name field */}
        <input
          type="text"
          name="driverName"
          placeholder="Driver Name"
          value={formData.driverName}
          onChange={handleChange}
          required
        />

        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="Active">Active</option>
          <option value="Maintenance">Maintenance</option>
        </select>

        <div className="form-buttons">
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Truck'}
          </button>
          <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
