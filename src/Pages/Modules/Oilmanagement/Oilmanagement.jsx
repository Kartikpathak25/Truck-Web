// src/Pages/Modules/Oilmanagement/Oilmanagement.jsx
import React, { useState } from "react";
import Sidebar from "../../../Component/Sidebar/Sidebar";
import TankerFill from "./operation/TankerFill/TankerFill";
import TruckFill from "./operation/TruckFill/TruckFill";
import "./Oilmanagement.css";

export default function Oilmanagement() {
  const [activeForm, setActiveForm] = useState(null);

  const closeModal = () => setActiveForm(null);

  return (
    <div className="oil-dashboard">
      <Sidebar />

      <div className="oil-content">
        <div className="oil-header">
          <h2>🛢️ Oil Management - Admin Panel</h2>
          <div className="admin-badge">
            <span className="badge-admin">👑 Admin Access</span>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn-tanker" onClick={() => setActiveForm("tanker")}>
            🚚 Fill Truck from Tanker
          </button>
          <button className="btn-truck" onClick={() => setActiveForm("truck")}>
            ⛽ Fill Tanker from Pump
          </button>
        </div>

        {activeForm && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content oil-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={closeModal}>✕</button>

              {activeForm === "tanker" && (
                <TankerFill onClose={closeModal} isAdmin={true} />
              )}

              {activeForm === "truck" && (
                <TruckFill onClose={closeModal} isAdmin={true} />
              )}
            </div>
          </div>
        )}

        <div className="records-section">
          <div className="records-card">
            <div className="card-header">
              <h3>📋 Tanker → Truck Fill Records (All Users)</h3>
              <span className="record-count">View & manage all records</span>
            </div>
            <TankerFill showRecordsOnly isAdmin={true} />
          </div>

          <div className="records-card">
            <div className="card-header">
              <h3>📋 Pump → Tanker Fill Records (All Users)</h3>
              <span className="record-count">View & manage all records</span>
            </div>
            <TruckFill showRecordsOnly isAdmin={true} />
          </div>
        </div>
      </div>
    </div>
  );
}