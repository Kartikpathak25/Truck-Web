import React, { useState, useEffect } from 'react';
import {
  doc,
  updateDoc,
  getDocs,
  collection,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../../../firebase';
import './EditTruck.css';

export default function EditTruck({
  initialData,
  onClose,
  onUpdate,
  sourceCollection,
  loading = false
}) {

  const [formData, setFormData] = useState({
    type: 'Vehicle',
    truckNumber: '',
    model: '',
    location: '',
    capacity: '',
    remainingOil: '',      // ✅ TANKER FIELD
    currentReading: '',    // ✅ VEHICLE FIELD
    driverName: '',
    status: 'Active',
    ownership: '',
  });

  const [locations, setLocations] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ================= FETCH ACTIVE LOCATIONS =================
  useEffect(() => {
    const fetchLocations = async () => {
      const q = query(collection(db, 'cities'), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      const locs = snapshot.docs.map(d => d.data().name).filter(Boolean);
      setLocations(locs);
    };
    fetchLocations();
  }, []);

  // ================= PREFILL =================
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'Vehicle',
        truckNumber: initialData.truckNumber || '',
        model: initialData.model || '',
        location: initialData.location || '',
        capacity: initialData.capacity || '',
        remainingOil: initialData.remainingOil || '',
        currentReading: initialData.currentReading || '',
        driverName: initialData.driverName || '',
        status: initialData.status || 'Active',
        ownership: initialData.ownership || '',
      });
    }
  }, [initialData]);

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    // 🧠 Type change cleanup (same as Add form)
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value,
        capacity: value === 'Tanker' ? prev.capacity : '',
        remainingOil: value === 'Tanker' ? prev.remainingOil : '',
        currentReading: value === 'Vehicle' ? prev.currentReading : '',
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ================= UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUpdating || loading) return;

    setIsUpdating(true);
    setErrorMsg('');

    try {
      const collectionName =
        sourceCollection ??
        (formData.type === 'Tanker' ? 'tankers' : 'trucks');

      const ref = doc(db, collectionName, initialData.id);

      const cleanData = { ...formData };

      // 🔒 CLEANUP (same as AddTruck)
      if (formData.type === 'Vehicle') {
        delete cleanData.capacity;
        delete cleanData.remainingOil;
      }

      if (formData.type === 'Tanker') {
        delete cleanData.currentReading;
      }

      await updateDoc(ref, cleanData);

      onUpdate && onUpdate({ id: initialData.id, ...cleanData });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Update failed. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const disabledAll = isUpdating || loading;

  // ================= LABELS =================
  const ownershipLabel =
    formData.type === 'Tanker'
      ? 'Ownership (Own Tanker / External Tanker)'
      : 'Ownership (Own Vehicle / External Vehicle)';

  const ownText = formData.type === 'Tanker' ? 'Own Tanker' : 'Own Vehicle';
  const extText = formData.type === 'Tanker' ? 'External Tanker' : 'External Vehicle';

  // ================= JSX =================
  return (
    <div className="edit-truck-form-container">
      <h2>Edit {formData.type}</h2>

      {errorMsg && <div className="form-error">{errorMsg}</div>}

      <form onSubmit={handleSubmit}>

        <select name="type" value={formData.type} onChange={handleChange} disabled={disabledAll}>
          <option value="Vehicle">Vehicle</option>
          <option value="Tanker">Tanker</option>
        </select>

        <input type="text" value={formData.truckNumber} disabled />

        <input
          type="text"
          name="model"
          placeholder="Model"
          value={formData.model}
          onChange={handleChange}
          required
          disabled={disabledAll}
        />

        <select
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
          disabled={disabledAll}
        >
          <option value="">Select Location</option>
          {locations.map((loc, i) => (
            <option key={i} value={loc}>{loc}</option>
          ))}
        </select>

        {/* ========= TANKER ONLY ========= */}
        {formData.type === 'Tanker' && (
          <>
            <input
              type="number"
              name="capacity"
              placeholder="Capacity (L)"
              value={formData.capacity}
              onChange={handleChange}
              required
              disabled={disabledAll}
            />

            <input
              type="number"
              name="remainingOil"
              placeholder="Remaining Oil (L)"
              value={formData.remainingOil}
              onChange={handleChange}
              required
              disabled={disabledAll}
            />
          </>
        )}

        {/* ========= VEHICLE ONLY ========= */}
        {formData.type === 'Vehicle' && (
          <input
            type="number"
            name="currentReading"
            placeholder="Current Reading (km)"
            value={formData.currentReading}
            onChange={handleChange}
            required
            disabled={disabledAll}
          />
        )}

        <input
          type="text"
          name="driverName"
          placeholder="Driver Name"
          value={formData.driverName}
          onChange={handleChange}
          required
          disabled={disabledAll}
        />

        <select
          name="ownership"
          value={formData.ownership}
          onChange={handleChange}
          required
          disabled={disabledAll}
        >
          <option value="">{ownershipLabel}</option>
          <option value="own">{ownText}</option>
          <option value="external">{extText}</option>
        </select>

        <select name="status" value={formData.status} onChange={handleChange} disabled={disabledAll}>
          <option value="Active">Active</option>
          <option value="Maintenance">Maintenance</option>
        </select>

        <div className="form-buttons">
          <button type="submit" className="submit-btn" disabled={disabledAll}>
            {disabledAll ? 'Updating...' : 'Update'}
          </button>
          <button type="button" className="cancel-btn" onClick={onClose} disabled={disabledAll}>
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
