import React, { useState } from 'react';
import Sidebar from '../../../Component/Sidebar/Sidebar';
import AddCityForm from '../Cityoperation/Add/AddCity';
import EditCityForm from '../Cityoperation/Edit/EditCity';
import { FaUserTie, FaGasPump, FaCheckCircle, FaTimesCircle, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import './Cityoperation.css'; // ✅ This is your main CSS for this page




export default function Cityoperation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cities, setCities] = useState([
    {
      name: 'Mumbai',
      manager: 'Rajesh Kumar',
      pump: 'HP Petrol Pump - Andheri',
      status: 'active',
      fuelLeft: '12,500 L',
    },
    {
      name: 'Bangalore',
      manager: 'Suresh Nair',
      pump: 'Bharat Petroleum - Koramangala',
      status: 'active',
      fuelLeft: '8,200 L',
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCity, setEditingCity] = useState(null);

  const handleAddCity = (newCity) => {
    setCities(prev => [...prev, newCity]);
    setShowAddForm(false);
  };

  const handleUpdateCity = (updatedCity) => {
    setCities(prev =>
      prev.map(city => city.name === updatedCity.name ? updatedCity : city)
    );
    setEditingCity(null);
  };

  const handleDelete = (name) => {
    const confirm = window.confirm(`Delete ${name}?`);
    if (confirm) {
      setCities(prev => prev.filter(city => city.name !== name));
    }
  };

  const handleEditClick = (city) => {
    setEditingCity(city);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCity(null);
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="city-operations-container">
      <Sidebar />
      <div className="city-operations-content">
        <div className="header-row">
          <h1>City Operations</h1>
          <button className="add-city-btn" onClick={() => setShowAddForm(true)}>
            <FaPlus /> Add City
          </button>
        </div>

        {showAddForm && (
          <div className="form-wrapper">
            <AddCityForm onAddCity={handleAddCity} onCancel={handleCancel} />
          </div>
        )}

        {editingCity && (
          <div className="form-wrapper">
            <EditCityForm cityData={editingCity} onUpdateCity={handleUpdateCity} onCancel={handleCancel} />
          </div>
        )}

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search city by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="city-cards">
          {filteredCities.map((city) => (
            <div className="city-card" key={city.name}>
              <h2>{city.name}</h2>
              <p><FaUserTie /> Manager: {city.manager}</p>
              <p><FaGasPump /> Pump: {city.pump}</p>
              <p className={`status ${city.status}`}>
                {city.status === 'active' ? <FaCheckCircle /> : <FaTimesCircle />}
                {city.status.charAt(0).toUpperCase() + city.status.slice(1)}
              </p>
              <div className="fuel-info">
                <p>Remaining Fuel</p>
                <h3>{city.fuelLeft}</h3>
              </div>
              <div className="card-actions">
                <button className="edit-btn" onClick={() => handleEditClick(city)}><FaEdit /> Edit</button>
                <button className="delete-btn" onClick={() => handleDelete(city.name)}><FaTrash /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
