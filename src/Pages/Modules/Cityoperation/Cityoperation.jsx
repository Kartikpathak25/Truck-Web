// src/pages/Modules/Cityoperation/Cityoperation.js
import React, { useState, useEffect } from "react";
import Sidebar from "../../../Component/Sidebar/Sidebar";
import AddCityForm from "../Cityoperation/Add/AddCity";
import EditCityForm from "../Cityoperation/Edit/EditCity";
import { FaUserTie, FaGasPump, FaCheckCircle, FaTimesCircle, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { db } from "../../../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import "./Cityoperation.css";

export default function Cityoperation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cities, setCities] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCity, setEditingCity] = useState(null);

  // ✅ Fetch cities from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "cities"), (snap) => {
      setCities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ✅ Add new city
  const handleAddCity = async (newCity) => {
    await addDoc(collection(db, "cities"), {
      ...newCity,
      createdAt: serverTimestamp(),
    });
    setShowAddForm(false);
  };

  // ✅ Update city
  const handleUpdateCity = async (updatedCity) => {
    const cityRef = doc(db, "cities", updatedCity.id);
    await updateDoc(cityRef, updatedCity);
    setEditingCity(null);
  };

  // ✅ Delete city
  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(`Delete ${name}?`);
    if (confirmDelete) {
      await deleteDoc(doc(db, "cities", id));
    }
  };

  const handleEditClick = (city) => {
    setEditingCity(city);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCity(null);
  };

  const filteredCities = cities.filter((city) =>
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
            <EditCityForm
              cityData={editingCity}
              onUpdateCity={handleUpdateCity}
              onCancel={handleCancel}
            />
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
            <div className="city-card" key={city.id}>
              <h2>{city.name}</h2>
              <p><FaUserTie /> Manager: {city.manager}</p>
              <p><FaGasPump /> Pump: {city.pump}</p>
              <p className={`status ${city.status}`}>
                {city.status === "active" ? <FaCheckCircle /> : <FaTimesCircle />}
                {city.status.charAt(0).toUpperCase() + city.status.slice(1)}
              </p>
              <div className="fuel-info">
                <p>Remaining Fuel</p>
                <h3>{city.fuelLeft}</h3>
              </div>
              <div className="card-actions">
                <button className="edit-btn" onClick={() => handleEditClick(city)}>
                  <FaEdit /> Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(city.id, city.name)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
