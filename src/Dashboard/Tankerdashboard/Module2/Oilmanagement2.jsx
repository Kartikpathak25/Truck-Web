// src/Dashboard/Tankerdashboard/Module2/Oilmanagement2.jsx
import React, { useState } from "react";
import Sidebar2 from "../../../Component/Sidebar/Sidebar2/Sidebar2";
import TankerFill from "../../../Pages/Modules/Oilmanagement/operation/TankerFill/TankerFill";
import TruckFill from "../../../Pages/Modules/Oilmanagement/operation/TruckFill/TruckFill";
import "./Oilmanagement2.css";

export default function Oilmanagement2() {
  const [activeForm, setActiveForm] = useState(null);

  const closeModal = () => setActiveForm(null);

  return (
    <div className="oil-dashboard">
      <Sidebar2 />

      <div className="oil-content">
        <div className="oil-header">
          <h2>🛢️ Oil Management</h2>
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
                <TankerFill onClose={closeModal} />
              )}

              {activeForm === "truck" && (
                <TruckFill onClose={closeModal} />
              )}
            </div>
          </div>
        )}

        <div className="records-section">
          <div className="records-card">
            <h3>📋 Tanker → Truck Fill Records</h3>
            <TankerFill showRecordsOnly />
          </div>

          <div className="records-card">
            <h3>📋 Pump → Tanker Fill Records</h3>
            <TruckFill showRecordsOnly />
          </div>
        </div>
      </div>
    </div>
  );
}