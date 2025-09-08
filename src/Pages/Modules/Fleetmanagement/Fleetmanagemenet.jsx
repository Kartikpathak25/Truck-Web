import React, { useState, useEffect } from 'react';
import Sidebar from '../../../Component/Sidebar/Sidebar';
import './Fleetmanagement.css';
import AddTruck from '../Fleetmanagement/CRUD/Add/AddTruck';
import EditTruck from './CRUD/Edit/EditTruck';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { db } from '../../../firebase';
import { collection, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const Fleetmanagement = () => {
  const [trucks, setTrucks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Realtime Firestore listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'trucks'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrucks(data);
    });
    return () => unsub();
  }, []);

  // Update Truck
  const handleUpdateTruck = async (updatedTruck) => {
    try {
      const { id, ...fieldsToUpdate } = updatedTruck;
      const truckRef = doc(db, 'trucks', id);
      await updateDoc(truckRef, fieldsToUpdate);
      setShowEditForm(false);
      setEditingTruck(null);
    } catch (err) {
      console.error("Error updating truck:", err);
    }
  };

  // Open Edit Modal
  const handleEdit = (truck) => {
    setEditingTruck(truck);
    setShowEditForm(true);
  };

  // Delete Truck
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'trucks', id));
    } catch (err) {
      console.error("Error deleting truck:", err);
    }
  };

  // Filter trucks
  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch =
      truck.truckNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' || truck.status === statusFilter;
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
          <input
            type="text"
            placeholder="Search by Truck Number or Model..."
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
              />
            </div>
          </div>
        )}

        <div className="fleet-cards">
          {filteredTrucks.map((truck) => (
            <div key={truck.id} className="fleet-card">
              <h3>{truck.truckNumber} <span className="truck-model">({truck.model})</span></h3>
              <p><strong>📍 Location:</strong> {truck.location}</p>
              <p><strong>🛢 Capacity:</strong> {truck.capacity}</p>
              <p><strong>⚙️ Status:</strong> {truck.status}</p>

              <div className="card-actions">
                <button className="edit-btn" onClick={() => handleEdit(truck)}>
                  <FaEdit /> Edit
                </button>
                <button className="delete-btn" onClick={() => handleDelete(truck.id)}>
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
