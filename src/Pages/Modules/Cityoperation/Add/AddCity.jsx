import React, { useState } from 'react';
import './AddCity.css';

export default function AddCity({ onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    manager: '',
    pump: '',
    status: 'active',
    fuelLeft: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('City Added:', formData); // ✅ Console only
    onCancel(); // ✅ Close form
  };

  return (
    <div className="add-city-form-container">
      <h2>Add New City</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="City Name" value={formData.name} onChange={handleChange} required />
        <input type="text" name="manager" placeholder="Operations Manager" value={formData.manager} onChange={handleChange} required />
        <input type="text" name="pump" placeholder="Pump Name" value={formData.pump} onChange={handleChange} required />
        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input type="text" name="fuelLeft" placeholder="Fuel Left (e.g. 5000 L)" value={formData.fuelLeft} onChange={handleChange} required />
        <div className="form-buttons">
          <button type="submit" className="submit-btn">Add City</button>
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
