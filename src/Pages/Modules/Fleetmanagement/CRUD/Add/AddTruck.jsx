import React, { useState, useEffect } from 'react';
import './AddTruck.css';

import { db } from "../../../../../firebase";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';

export default function AddTruck({ onClose, onAdd, loading = false }) {

  // 🔹 formData me remainingOil ADD
const [formData, setFormData] = useState({
  type: 'Vehicle',
  truckNumber: '',
  model: '',
  location: '',
  capacity: '',        // ✅ tanker
  remainingOil: '',    // ✅ tanker (MANUAL ENTRY)
  currentReading: '',  // vehicle
  driverName: '',
  status: 'Active',
  ownership: ''
});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState([]);
  const [duplicateError, setDuplicateError] = useState('');
  const [showDuplicateCheck, setShowDuplicateCheck] = useState(false);

  // ================= FETCH ONLY ACTIVE LOCATIONS =================
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const q = query(
          collection(db, "cities"),
          where("status", "==", "active")
        );

        const snapshot = await getDocs(q);
        const locs = snapshot.docs
          .map(doc => doc.data().name)
          .filter(Boolean);

        setLocations(locs);
      } catch (error) {
        console.error("Error fetching active locations:", error);
      }
    };

    fetchLocations();
  }, []);

  // ================= DUPLICATE CHECK =================
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

      setDuplicateError(
        querySnapshot.empty
          ? ''
          : `⚠️ Truck Number "${truckNumber}" already exists!`
      );
    } catch (error) {
      console.error('Duplicate check error:', error);
    } finally {
      setShowDuplicateCheck(false);
    }
  };

  // ================= HANDLE CHANGE =================
  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === 'type') {
      setDuplicateError('');
      setFormData(prev => ({
        ...prev,
        type: value,
        ownership: '',
        capacity: value === 'Tanker' ? prev.capacity : '',
        remainingOil: value === 'Tanker' ? prev.remainingOil : '',
        currentReading: value === 'Vehicle' ? prev.currentReading : ''
      }));

      if (formData.truckNumber) {
        await checkDuplicateRealTime(formData.truckNumber, value);
      }
      return;
    }

    if (name === 'truckNumber') {
      setFormData(prev => ({ ...prev, truckNumber: value }));
      if (formData.type) {
        await checkDuplicateRealTime(value, formData.type);
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (duplicateError || isSubmitting || loading) return;

    setIsSubmitting(true);

    try {
      const cleanData = { ...formData };

      // 🔒 VEHICLE CLEANUP
      if (formData.type === 'Vehicle') {
  delete cleanData.capacity;
  delete cleanData.remainingOil;
}

if (formData.type === 'Tanker') {
  delete cleanData.currentReading;
}


      const collectionName =
        formData.type === 'Tanker' ? 'tankers' : 'trucks';

      if (onAdd) {
        await onAdd(cleanData);
      } else {
        await addDoc(collection(db, collectionName), cleanData);
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding record:', error);
      setDuplicateError('❌ Failed to add record. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= RESET =================
  const resetForm = () => {
    setFormData({
      type: 'Vehicle',
      truckNumber: '',
      model: '',
      location: '',
      capacity: '',
      remainingOil: '',
      currentReading: '',
      driverName: '',
      status: 'Active',
      ownership: ''
    });
    setDuplicateError('');
  };

  // ================= DYNAMIC LABELS =================
  const ownershipLabel =
    formData.type === 'Tanker'
      ? 'Ownership (Own Tanker / External Tanker)'
      : 'Ownership (Own Vehicle / External Vehicle)';

  const ownOptionText =
    formData.type === 'Tanker' ? 'Own Tanker' : 'Own Vehicle';

  const externalOptionText =
    formData.type === 'Tanker' ? 'External Tanker' : 'External Vehicle';

  // ================= JSX =================
  return (
    <div className="add-truck-form-container">
      <h2>Add New Vehicle or Tanker</h2>

      {duplicateError && (
        <div className="duplicate-error">{duplicateError}</div>
      )}

      <form onSubmit={handleSubmit}>

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

        {/* ================= TANKER FIELDS ================= */}
        {formData.type === 'Tanker' && (
  <>
    <input
      type="number"
      name="capacity"
      placeholder="Capacity (L) *"
      value={formData.capacity}
      onChange={handleChange}
      required
    />

    <input
      type="number"
      name="remainingOil"
      placeholder="Initial Remaining Oil (L) *"
      value={formData.remainingOil}
      onChange={handleChange}
      required
    />
  </>
)}

        {/* ================= VEHICLE FIELD ================= */}
        {formData.type === 'Vehicle' && (
          <input
            type="number"
            name="currentReading"
            placeholder="Current Reading (km) *"
            value={formData.currentReading}
            onChange={handleChange}
            required
            disabled={loading}
          />
        )}

        <input
          type="text"
          name="driverName"
          placeholder="Driver Name *"
          value={formData.driverName}
          onChange={handleChange}
          required
          disabled={loading}
        />

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
              : `Add ${formData.type}`}
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
