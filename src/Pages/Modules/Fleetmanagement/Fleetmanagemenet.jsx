import React, { useState, useEffect } from 'react';
import Sidebar from '../../../Component/Sidebar/Sidebar';
import './Fleetmanagement.css';
import AddTruck from '../Fleetmanagement/CRUD/Add/AddTruck';
import EditTruck from './CRUD/Edit/EditTruck';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { db } from '../../../firebase';
import { collection, onSnapshot, updateDoc, doc, deleteDoc, addDoc, query, where, getDocs } from 'firebase/firestore';

const Fleetmanagement = () => {
  const [fleetData, setFleetData] = useState([]);
  const [selectedType, setSelectedType] = useState('Vehicle');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔥 Check for duplicate truckNumber
  const checkDuplicate = async (truckNumber, type, excludeId = null) => {
    try {
      const collectionName = type === 'Tanker' ? 'tankers' : 'trucks';
      const q = query(
        collection(db, collectionName),
        where('truckNumber', '==', truckNumber)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return false;

      if (excludeId) {
        const hasDuplicate = querySnapshot.docs.some(doc => doc.id !== excludeId);
        return hasDuplicate;
      }
      
      return true;
    } catch (err) {
      console.error('Error checking duplicate:', err);
      return false;
    }
  };

  // 🔥 Realtime listener for selected type
  useEffect(() => {
    const collectionName = selectedType === 'Tanker' ? 'tankers' : 'trucks';
    const unsub = onSnapshot(collection(db, collectionName), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFleetData(data);
    });
    return () => unsub();
  }, [selectedType]);

  // 👈 Add Truck with duplicate check
  const handleAddTruck = async (newTruck) => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      const isDuplicate = await checkDuplicate(newTruck.truckNumber, newTruck.type);
      if (isDuplicate) {
        setErrorMessage(`❌ Error: Truck Number "${newTruck.truckNumber}" already exists!`);
        setLoading(false);
        return;
      }
      
      const collectionName = newTruck.type === 'Tanker' ? 'tankers' : 'trucks';
      await addDoc(collection(db, collectionName), newTruck);
      
      setShowAddForm(false);
      setErrorMessage('✅ Truck added successfully!');
      setTimeout(() => setErrorMessage(''), 3000);
    } catch (err) {
      setErrorMessage('❌ Error adding truck. Please try again.');
      console.error("Error adding truck:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔧 Update Truck/Tanker with duplicate check
  const handleUpdateTruck = async (updatedTruck) => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      const isDuplicate = await checkDuplicate(
        updatedTruck.truckNumber, 
        updatedTruck.type, 
        updatedTruck.id
      );
      
      if (isDuplicate) {
        setErrorMessage(`❌ Error: Truck Number "${updatedTruck.truckNumber}" already exists!`);
        setLoading(false);
        return;
      }

      const { id, ...fieldsToUpdate } = updatedTruck;
      const collectionName = updatedTruck.type === 'Tanker' ? 'tankers' : 'trucks';
      await updateDoc(doc(db, collectionName, id), fieldsToUpdate);
      
      setShowEditForm(false);
      setEditingTruck(null);
      setErrorMessage('✅ Truck updated successfully!');
      setTimeout(() => setErrorMessage(''), 3000);
    } catch (err) {
      setErrorMessage('❌ Error updating truck. Please try again.');
      console.error("Error updating record:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✏️ Open Edit Modal
  const handleEdit = (truck) => {
    setEditingTruck(truck);
    setShowEditForm(true);
    setErrorMessage('');
  };

  // 🗑 Delete Truck/Tanker
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this truck?')) return;
    
    setLoading(true);
    try {
      const collectionName = selectedType === 'Tanker' ? 'tankers' : 'trucks';
      await deleteDoc(doc(db, collectionName, id));
      setErrorMessage('✅ Truck deleted successfully!');
      setTimeout(() => setErrorMessage(''), 3000);
    } catch (err) {
      setErrorMessage('❌ Error deleting truck. Please try again.');
      console.error("Error deleting record:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Filter records
  const filteredFleet = fleetData.filter(item => {
    const matchesSearch =
      item.truckNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 👈 Get ownership display text
  const getOwnershipText = (ownership) => {
    if (!ownership) return 'N/A';
    return ownership === 'own' ? 'Own' : 'External';
  };

  return (
    <div className="fleet-dashboard">
      <Sidebar />

      <div className="fleet-content">
        <div className="fleet-header">
          <h1>Fleet Management</h1>
          <button 
            className="add-button" 
            onClick={() => setShowAddForm(true)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Add'}
          </button>
        </div>

        {/* Error/Success Message Display */}
        {errorMessage && (
          <div className={`message ${errorMessage.includes('Error') ? 'error' : 'success'}`}>
            {errorMessage}
          </div>
        )}

        <div className="fleet-controls">
          <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            <option value="Vehicle">Vehicle</option>
            <option value="Tanker">Tanker</option>
          </select>

          <input
            type="text"
            placeholder="Search by Number or Model..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <AddTruck 
                onClose={() => setShowAddForm(false)}
                onAdd={handleAddTruck}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Edit Form */}
        {showEditForm && editingTruck && (
          <div className="modal-overlay">
            <div className="modal-content">
              <EditTruck
                initialData={editingTruck}
                onUpdate={handleUpdateTruck}
                onClose={() => {
                  setShowEditForm(false);
                  setEditingTruck(null);
                }}
                loading={loading}
              />
            </div>
          </div>
        )}

        <div className="fleet-cards">
          {filteredFleet.map((item) => (
            <div key={item.id} className="fleet-card">
              <h3>
                {item.type === 'Tanker' ? '🛢 Tanker ID:' : '🚚 Vehicle ID:'} {item.truckNumber}
                <span className="truck-model"> ({item.model})</span>
              </h3>
              <p><strong>📍 Location:</strong> {item.location}</p>
              <p><strong>🧱 Capacity:</strong> {item.capacity}</p>
              <p><strong>📊 Reading:</strong> {item.currentReading} km</p>
              <p><strong>👨‍✈️ Driver:</strong> {item.driverName}</p>
              {/* 👈 NEW Ownership Field Display */}
              <p><strong>🏢 Ownership:</strong> {getOwnershipText(item.ownership)}</p>
              <p className="status-row">
  <strong className="label">⚙️ Status:</strong>
  <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
</p>


              <div className="card-actions">
                <button 
                  className="edit-btn" 
                  onClick={() => handleEdit(item)}
                  disabled={loading}
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(item.id)}
                  disabled={loading}
                >
                  <FaTrashAlt /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredFleet.length === 0 && (
          <div className="no-data">
            <p>No trucks found matching your criteria.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Fleetmanagement;
