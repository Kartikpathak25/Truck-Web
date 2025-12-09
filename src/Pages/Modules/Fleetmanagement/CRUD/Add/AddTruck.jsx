import React, { useState, useEffect } from 'react';
import './AddTruck.css';
import { db } from "../../../../../firebase";
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function AddTruck({ onClose }) {
  const [formData, setFormData] = useState({
    type: 'Vehicle',
    truckNumber: '',
    model: '',
    location: '',
    capacity: '',
    currentReading: '',
    driverName: '',
    status: 'Active'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);

  // 🔥 Fetch locations from cities collection
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const snapshot = await getDocs(collection(db, "cities"));
        const locs = snapshot.docs.map(doc => doc.data().name); // 👈 adjust if field differs
        setLocations(locs.filter(Boolean));
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const collectionName = formData.type === 'Tanker' ? 'tankers' : 'trucks';
      await addDoc(collection(db, collectionName), formData);

      // Reset form after successful add
      setFormData({
        type: 'Vehicle',
        truckNumber: '',
        model: '',
        location: '',
        capacity: '',
        currentReading: '',
        driverName: '',
        status: 'Active'
      });

      onClose();
    } catch (error) {
      console.error('Error adding record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-truck-form-container">
      <h2>Add New Vehicle or Tanker</h2>
      <form onSubmit={handleSubmit}>
        
        {/* Type dropdown */}
        <select name="type" value={formData.type} onChange={handleChange}>
          <option value="Vehicle">Vehicle</option>
          <option value="Tanker">Tanker</option>
        </select>

        <input
          type="text"
          name="truckNumber"
          placeholder="Vehicle / Tanker Number"
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

        {/* Location dropdown */}
        <select
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
        >
          <option value="">Select Location</option>
          {locations.map((loc, index) => (
            <option key={index} value={loc}>{loc}</option>
          ))}
        </select>

        <input
          type="text"
          name="capacity"
          placeholder="Capacity"
          value={formData.capacity}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="currentReading"
          placeholder="Current Reading (km)"
          value={formData.currentReading}
          onChange={handleChange}
          required
        />

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
            {isSubmitting ? 'Adding...' : `Add ${formData.type}`}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
