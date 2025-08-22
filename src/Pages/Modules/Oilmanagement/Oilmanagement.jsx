import React, { useState } from 'react';
import Sidebar from '../../../Component/Sidebar/Sidebar';
import Truckfill from './operation/Truck Fill To Tanker/Truckfill'; // ✅ Import Truckfill
import './Oilmanagement.css';

const operations = [/* same as before */];

export default function Oilmanagement() {
  const [showTankerForm, setShowTankerForm] = useState(false);
  const [showTruckForm, setShowTruckForm] = useState(false); // ✅ New state

  return (
    <div className="oil-dashboard">
      <Sidebar />

      <div className="oil-content">
        <h2>🛢️ Oil Management</h2>

        <div className="action-buttons">
          <button
            className="fill-btn tanker-fill"
            onClick={() => {
              setShowTankerForm(!showTankerForm);
              setShowTruckForm(false); // ✅ Hide other form
            }}
          >
            🚚 Tanker Fill Truck
          </button>

          <button
            className="fill-btn truck-fill"
            onClick={() => {
              setShowTruckForm(!showTruckForm);
              setShowTankerForm(false); // ✅ Hide other form
            }}
          >
            🛢️ Truck Fill Tanker
          </button>
        </div>

        {/* ✅ Tanker Fill Form */}
        {showTankerForm && (
          <div className="inline-form-card">
            <h3>🚚 Record Tanker Fill Operation</h3>
            <form className="inline-form">
              <div className="form-group">
                <label>Date & Time:</label>
                <input type="datetime-local" />
              </div>

              <div className="form-group">
                <label>Quantity (Liters):</label>
                <input type="number" placeholder="Enter quantity" />
              </div>

              <div className="form-group">
                <label>Tanker ID:</label>
                <select>
                  <option>Select Tanker</option>
                  <option value="1">Tanker 1</option>
                  <option value="2">Tanker 2</option>
                </select>
              </div>

              <div className="form-group">
                <label>Source Location:</label>
                <input type="text" placeholder="Enter source location" />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowTankerForm(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Record Fill Operation</button>
              </div>
            </form>
          </div>
        )}

        {/* ✅ Truck Fill Form */}
        {showTruckForm && (
          <div className="inline-form-card">
            <h3>🛢️ Fill From Truck</h3>
            <Truckfill />
          </div>
        )}

        <table className="operations-table">
          {/* ...table code... */}
        </table>
      </div>
    </div>
  );
}
