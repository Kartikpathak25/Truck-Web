import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../../../../../firebase';
import './EditTruck.css';

export default function EditTruck({
  initialData,
  onClose,
  onUpdate,
  sourceCollection,
  loading = false,          // optional prop from parent (for global loading)
}) {
  const [formData, setFormData] = useState({
    type: 'Vehicle',
    truckNumber: '',
    model: '',
    location: '',
    capacity: '',
    driverName: '',
    currentReading: '',
    status: 'Active',
    ownership: '',          // 👈 new field to match AddTruck / dashboard
  });

  const [locations, setLocations] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch locations from cities collection
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'cities'));
        const locs = snapshot.docs
          .map((d) => d.data().name)
          .filter(Boolean);
        setLocations(locs);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    fetchLocations();
  }, []);

  // Pre-fill form with initialData
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'Vehicle',
        truckNumber: initialData.truckNumber || '',
        model: initialData.model || '',
        location: initialData.location || '',
        capacity: initialData.capacity || '',
        driverName: initialData.driverName || '',
        currentReading: initialData.currentReading || '',
        status: initialData.status || 'Active',
        ownership: initialData.ownership || '',   // 👈 keep existing ownership
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUpdating || loading) return;

    setErrorMsg('');
    setIsUpdating(true);

    try {
      // Keep document in original collection
      const collectionName =
        sourceCollection ??
        (initialData?.type === 'Tanker' ? 'tankers' : 'trucks');

      const ref = doc(db, collectionName, initialData.id);

      await updateDoc(ref, {
        type: formData.type,
        truckNumber: formData.truckNumber,
        model: formData.model,
        location: formData.location,
        capacity: formData.capacity,
        driverName: formData.driverName,
        currentReading: formData.currentReading,
        status: formData.status,
        ownership: formData.ownership,          // 👈 update ownership too
      });

      if (onUpdate) onUpdate({ id: initialData.id, ...formData });
      onClose();
    } catch (error) {
      console.error('❌ Error updating truck:', error);
      setErrorMsg('Update failed. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Dynamic ownership labels like AddTruck
  const ownershipLabel =
    formData.type === 'Tanker'
      ? 'Ownership (Own Tanker / External Tanker)'
      : 'Ownership (Own Vehicle / External Vehicle)';

  const ownOptionText =
    formData.type === 'Tanker' ? 'Own Tanker' : 'Own Vehicle';

  const externalOptionText =
    formData.type === 'Tanker' ? 'External Tanker' : 'External Vehicle';

  const disabledAll = isUpdating || loading;

  return (
    <div className="edit-truck-form-container">
      <h2>Edit {formData.type}</h2>

      {errorMsg && <div className="form-error">{errorMsg}</div>}

      <form onSubmit={handleSubmit} aria-busy={disabledAll}>
        {/* Type (optional visual change only) */}
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          disabled={disabledAll}
        >
          <option value="Vehicle">Vehicle</option>
          <option value="Tanker">Tanker</option>
        </select>

        {/* Truck number (read-only) */}
        <input
          type="text"
          value={formData.truckNumber}
          disabled
        />

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
            <option key={i} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="capacity"
          placeholder="Capacity"
          value={formData.capacity}
          onChange={handleChange}
          required
          disabled={disabledAll}
        />

        <input
          type="text"
          name="driverName"
          placeholder="Driver Name"
          value={formData.driverName}
          onChange={handleChange}
          required
          disabled={disabledAll}
        />

        <input
          type="number"
          name="currentReading"
          placeholder="Current Reading (km)"
          value={formData.currentReading}
          onChange={handleChange}
          required
          disabled={disabledAll}
        />

        {/* Ownership dropdown (same pattern as AddTruck) */}
        <select
          name="ownership"
          value={formData.ownership}
          onChange={handleChange}
          required
          disabled={disabledAll}
        >
          <option value="">{ownershipLabel}</option>
          <option value="own">{ownOptionText}</option>
          <option value="external">{externalOptionText}</option>
        </select>

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          disabled={disabledAll}
        >
          <option value="Active">Active</option>
          <option value="Maintenance">Maintenance</option>
        </select>

        <div className="form-buttons">
          <button
            type="submit"
            className={`submit-btn ${disabledAll ? 'loading' : ''}`}
            disabled={disabledAll}
          >
            {disabledAll ? 'Updating…' : 'Update'}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={disabledAll}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
