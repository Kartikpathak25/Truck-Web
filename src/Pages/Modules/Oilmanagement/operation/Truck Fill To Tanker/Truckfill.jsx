import React, { useState } from 'react';
import './Truckfill.css';

const initialFormState = {
  tankerId: '',
  product: '',
  quantity: '',
  pumpName: '',
  dateReceived: '',
  driverName: '',
  fuelRemaining: ''
};

export default function Truckfill() {
  const [formData, setFormData] = useState(initialFormState);
  const [submittedData, setSubmittedData] = useState(null);

  const handleChange = ({ target: { name, value } }) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmittedData(formData);
    setFormData(initialFormState);
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setSubmittedData(null);
  };

  return (
    <div className="form-container">
      <h2>🛢️ Fill From Tanker</h2>
      <form onSubmit={handleSubmit} className="tanker-form">
        <FormField label="Tanker ID">
          <select name="tankerId" value={formData.tankerId} onChange={handleChange} required>
            <option value="">Select Tanker</option>
            <option value="1">Tanker 1</option>
            <option value="2">Tanker 2</option>
            <option value="3">Tanker 3</option>
          </select>
        </FormField>

        <FormField label="Product">
          <select name="product" value={formData.product} onChange={handleChange} required>
            <option value="">Select Product</option>
            <option value="Diesel">Diesel</option>
            <option value="Petrol">Petrol</option>
          </select>
        </FormField>

        <FormField label="Quantity (L)">
          <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required />
        </FormField>

        <FormField label="Petrol Pump Name">
          <input type="text" name="pumpName" value={formData.pumpName} onChange={handleChange} required />
        </FormField>

        <FormField label="Date Received">
          <input type="date" name="dateReceived" value={formData.dateReceived} onChange={handleChange} required />
        </FormField>

        <FormField label="Driver Name">
          <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} required />
        </FormField>

        <FormField label="Fuel Remaining (L)">
          <input type="number" name="fuelRemaining" value={formData.fuelRemaining} onChange={handleChange} required />
        </FormField>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
          <button type="submit" className="submit-btn">Submit</button>
        </div>
      </form>

      {submittedData && (
        <div className="submitted-json">
          <h3>📦 Submitted Data</h3>
          <pre>{JSON.stringify(submittedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div className="form-group">
      <label>{label}:</label>
      {children}
    </div>
  );
}
