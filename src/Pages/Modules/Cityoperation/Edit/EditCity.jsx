import React, { useState } from 'react';
import './EditCity.css'; // Scoped styles for EditCity

export default function Editcity({ cityData, onCancel }) {
  const [formData, setFormData] = useState({ ...cityData });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updated City:', formData); // ✅ Console only
    onCancel(); // ✅ Close form after submit
  };

  return (
    <div className="edit-city-form-container">
      <h2>Edit City</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="City Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="manager"
          placeholder="Operations Manager"
          value={formData.manager}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="pump"
          placeholder="Pump Name"
          value={formData.pump}
          onChange={handleChange}
          required
        />
        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input
          type="text"
          name="fuelLeft"
          placeholder="Fuel Left (e.g. 5000 L)"
          value={formData.fuelLeft}
          onChange={handleChange}
          required
        />
        <div className="form-buttons">
          <button type="submit" className="submit-btn">Update City</button>
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
