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
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="oil-content">
        {/* HEADER */}
        <div className="oil-header">
          <h2>🛢️ Oil Management - Admin Panel</h2>
          <div className="admin-badge">
            <span className="badge-admin">👑 Admin Access</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="action-buttons">
          <button
            className="btn-tanker"
            onClick={() => setActiveForm("tanker")}
          >
            🚚 Fill Truck from Tanker
          </button>

          <button
            className="btn-truck"
            onClick={() => setActiveForm("truck")}
          >
            ⛽ Fill Tanker from Pump
          </button>
        </div>

        {/* MODAL */}
        {activeForm && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content oil-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>

              {activeForm === "tanker" && (
                <TankerFill onClose={closeModal} isAdmin />
              )}

              {activeForm === "truck" && (
                <TruckFill onClose={closeModal} isAdmin />
              )}
            </div>
          </div>
        )}

        {/* ===============================
            RECORDS SECTION (NO PAGE SCROLL)
           =============================== */}
        <div className="records-section">
          {/* TANKER → TRUCK RECORDS */}
          <div className="records-card">
            <div className="card-header">
              <h3>📋 Tanker → Truck Fill Records (All Users)</h3>
              <span className="record-count">Manage Records</span>
            </div>

            {/* 🔥 ONLY THIS AREA SCROLLS */}
            <div className="table-scroll">
              <TankerFill showRecordsOnly isAdmin />
            </div>
          </div>

          {/* PUMP → TANKER RECORDS */}
          <div className="records-card">
            <div className="card-header">
              <h3>📋 Pump → Tanker Fill Records (All Users)</h3>
              <span className="record-count">Manage Records</span>
            </div>

            {/* 🔥 ONLY THIS AREA SCROLLS */}
            <div className="table-scroll">
              <TruckFill showRecordsOnly isAdmin={3} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
