import React, { useState } from 'react';
import Sidebar from '../../../Component/Sidebar/Sidebar';
import './Fleetmanagement.css';
import AddTruck from '../Fleetmanagement/CRUD/Add/AddTruck';
import EditTruck from './CRUD/Edit/EditTruck';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

const Fleetmanagement = () => {
  const [trucks, setTrucks] = useState([
    {
      id: 'TRK-001',
      model: 'Volvo FH16',
      location: 'Mumbai Terminal',
      capacity: '25,000 L',
      status: 'Active'
    },
    {
      id: 'TRK-002',
      model: 'Scania R Series',
      location: 'Delhi Depot',
      capacity: '30,000 L',
      status: 'Maintenance'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const handleAddTruck = (newTruck) => {
    setTrucks(prev => [...prev, newTruck]);
    setShowAddForm(false);
  };

  const handleUpdateTruck = (updatedTruck) => {
    setTrucks(prev =>
      prev.map(truck =>
        truck.id === updatedTruck.id ? updatedTruck : truck
      )
    );
    setShowEditForm(false);
    setEditingTruck(null);
  };

  const handleEdit = (truck) => {
    setEditingTruck(truck);
    setShowEditForm(true);
  };

  const handleDelete = (id) => {
    setTrucks(prev => prev.filter(truck => truck.id !== id));
  };

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch =
      truck.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.model.toLowerCase().includes(searchTerm.toLowerCase());
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
            placeholder="Search by Truck ID or Model..."
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

        {/* ✅ Add Form Modal */}
        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <AddTruck
                onAdd={handleAddTruck}
                onClose={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}

        {/* ✅ Edit Form Modal */}
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
          {filteredTrucks.map((truck, index) => (
            <div key={index} className="fleet-card">
              <h3>{truck.id} <span className="truck-model">({truck.model})</span></h3>
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
