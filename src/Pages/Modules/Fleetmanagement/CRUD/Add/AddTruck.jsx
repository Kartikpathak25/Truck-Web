import React, { useState, useEffect } from 'react';
import './AddTruck.css';
import { db } from "../../../../../firebase";
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export default function AddTruck({ onClose, onAdd, loading = false }) {
  const [formData, setFormData] = useState({
    type: 'Vehicle',
    truckNumber: '',
    model: '',
    location: '',
    capacity: '',
    currentReading: '',
    driverName: '',
    status: 'Active',
    ownership: '' // 👈 new field
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [duplicateError, setDuplicateError] = useState('');
  const [showDuplicateCheck, setShowDuplicateCheck] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const snapshot = await getDocs(collection(db, "cities"));
        const locs = snapshot.docs.map(doc => doc.data().name);
        setLocations(locs.filter(Boolean));
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

  const checkDuplicateRealTime = async (truckNumber, type) => {
    if (!truckNumber || truckNumber.length < 3) {
      setDuplicateError('');
      setShowDuplicateCheck(false);
      return;
    }

    try {
      setShowDuplicateCheck(true);
      const collectionName = type === 'Tanker' ? 'tankers' : 'trucks';
      const q = query(
        collection(db, collectionName),
        where('truckNumber', '==', truckNumber)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setDuplicateError('');
      } else {
        setDuplicateError(`⚠️ Truck Number "${truckNumber}" already exists!`);
      }
    } catch (error) {
      console.error('Real-time duplicate check error:', error);
    } finally {
      setShowDuplicateCheck(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    // type change -> also adjust ownership placeholder text (label is dynamic below)
    if (name === 'type') {
      setDuplicateError('');
      setFormData(prev => ({ ...prev, [name]: value, ownership: '' }));
      if (formData.truckNumber) {
        await checkDuplicateRealTime(formData.truckNumber, value);
      }
      return;
    }

    if (name === 'truckNumber') {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (formData.type) {
        await checkDuplicateRealTime(value, formData.type);
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (duplicateError) {
      alert(duplicateError);
      return;
    }

    if (isSubmitting || loading) return;

    setIsSubmitting(true);
    try {
      if (onAdd) {
        await onAdd(formData);
      } else {
        const collectionName = formData.type === 'Tanker' ? 'tankers' : 'trucks';
        await addDoc(collection(db, collectionName), formData);
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('Error adding record:', error);
      setDuplicateError('❌ Failed to add truck. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Vehicle',
      truckNumber: '',
      model: '',
      location: '',
      capacity: '',
      currentReading: '',
      driverName: '',
      status: 'Active',
      ownership: ''
    });
    setDuplicateError('');
  };

  const ownershipLabel =
    formData.type === 'Tanker'
      ? 'Ownership (Own Tanker / External Tanker)'
      : 'Ownership (Own Vehicle / External Vehicle)';

  const ownOptionText =
    formData.type === 'Tanker' ? 'Own Tanker' : 'Own Vehicle';

  const externalOptionText =
    formData.type === 'Tanker' ? 'External Tanker' : 'External Vehicle';

  return (
    <div className="add-truck-form-container">
      <h2>Add New Vehicle or Tanker</h2>
      
      {duplicateError && (
        <div className="duplicate-error">
          {duplicateError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Type dropdown */}
        <select name="type" value={formData.type} onChange={handleChange}>
          <option value="Vehicle">Vehicle</option>
          <option value="Tanker">Tanker</option>
        </select>

        <input
          type="text"
          name="truckNumber"
          placeholder="Vehicle / Tanker Number *"
          value={formData.truckNumber}
          onChange={handleChange}
          required
          className={duplicateError ? 'error' : ''}
          disabled={loading}
        />

        <input
          type="text"
          name="model"
          placeholder="Model *"
          value={formData.model}
          onChange={handleChange}
          required
          disabled={loading}
        />

        {/* Location dropdown */}
        <select
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="">Select Location</option>
          {locations.map((loc, index) => (
            <option key={index} value={loc}>{loc}</option>
          ))}
        </select>

        <input
          type="text"
          name="capacity"
          placeholder="Capacity *"
          value={formData.capacity}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <input
          type="number"
          name="currentReading"
          placeholder="Current Reading (km) *"
          value={formData.currentReading}
          onChange={handleChange}
          required
          disabled={loading}
        />

        <input
          type="text"
          name="driverName"
          placeholder="Driver Name *"
          value={formData.driverName}
          onChange={handleChange}
          required
          disabled={loading}
        />

        {/* Ownership dropdown (dynamic text) */}
        <select
          name="ownership"
          value={formData.ownership}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="">{ownershipLabel}</option>
          <option value="own">{ownOptionText}</option>
          <option value="external">{externalOptionText}</option>
        </select>

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="Active">Active</option>
          <option value="Maintenance">Maintenance</option>
        </select>

        <div className="form-buttons">
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSubmitting || loading || !!duplicateError}
          >
            {showDuplicateCheck || loading || isSubmitting 
              ? 'Checking...' 
              : `Add ${formData.type}`
            }
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
