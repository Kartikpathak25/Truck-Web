import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from "../../../../../firebase"; // ✅ Correct path
import './EditTruck.css';

export default function EditTruck({ initialData, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    truckNumber: '',
    model: '',
    location: '',
    capacity: '',
    status: 'Active'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        truckNumber: initialData.truckNumber || '', // ✅ UI me dikhega
        model: initialData.model || '',
        location: initialData.location || '',
        capacity: initialData.capacity || '',
        status: initialData.status || 'Active'
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const truckRef = doc(db, 'trucks', initialData.id); // ✅ Firestore ID

      await updateDoc(truckRef, {
        truckNumber: formData.truckNumber, // optional: agar truckNumber update karna hai
        model: formData.model,
        location: formData.location,
        capacity: formData.capacity,
        status: formData.status
      });

      console.log('✅ Truck Updated:', { id: initialData.id, ...formData });

      if (onUpdate) onUpdate({ id: initialData.id, ...formData });

      onClose();
    } catch (error) {
      console.error('❌ Error updating truck:', error);
    }
  };

  return (
    <div className="edit-truck-form-container">
      <h2>Edit Truck</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={formData.truckNumber} // ✅ UI me dikhega
          disabled
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
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="Active">Active</option>
          <option value="Maintenance">Maintenance</option>
        </select>

        <div className="form-buttons">
          <button type="submit" className="submit-btn">Update</button>
          <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
