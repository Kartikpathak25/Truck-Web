import React, { useState, useEffect } from 'react';
import Sidebar from '../../../Component/Sidebar/Sidebar';
import './Fleetmanagement.css';
import AddTruck from '../Fleetmanagement/CRUD/Add/AddTruck';
import EditTruck from './CRUD/Edit/EditTruck';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { db } from '../../../firebase';
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const Fleetmanagement = () => {
  const [fleetData, setFleetData] = useState([]);
  const [selectedType, setSelectedType] = useState('Vehicle'); // 👈 dropdown control
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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

  // 🔧 Update Truck/Tanker
  const handleUpdateTruck = async (updatedTruck) => {
    try {
      const { id, ...fieldsToUpdate } = updatedTruck;
      const collectionName = updatedTruck.type === 'Tanker' ? 'tankers' : 'trucks';
      await updateDoc(doc(db, collectionName, id), fieldsToUpdate);
      setShowEditForm(false);
      setEditingTruck(null);
    } catch (err) {
      console.error("Error updating record:", err);
    }
  };

  // ✏️ Open Edit Modal
  const handleEdit = (truck) => {
    setEditingTruck(truck);
    setShowEditForm(true);
  };

  // 🗑 Delete Truck/Tanker
  const handleDelete = async (id) => {
    try {
      const collectionName = selectedType === 'Tanker' ? 'tankers' : 'trucks';
      await deleteDoc(doc(db, collectionName, id));
    } catch (err) {
      console.error("Error deleting record:", err);
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

  return (
    <div className="fleet-dashboard">
      <Sidebar />

      <div className="fleet-content">
        <div className="fleet-header">
          <h1>Fleet Management</h1>
          <button className="add-button" onClick={() => setShowAddForm(true)}>Add</button>
        </div>

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
              <AddTruck onClose={() => setShowAddForm(false)} />
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
              <p><strong>⚙️ Status:</strong> {item.status}</p>

              <div className="card-actions">
                <button className="edit-btn" onClick={() => handleEdit(item)}>
                  <FaEdit /> Edit
                </button>
                <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                  <FaTrashAlt /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Fleetmanagement;
