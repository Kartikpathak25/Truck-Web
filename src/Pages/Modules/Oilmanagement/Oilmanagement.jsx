import React, { useState } from "react";
import Sidebar from "../../../Component/Sidebar/Sidebar";
import TankerFill from "../../../Pages/Modules/Oilmanagement/operation/TankerFill/TankerFill";
import TruckFill from "../../../Pages/Modules/Oilmanagement/operation/TruckFill/TruckFill";
import "./Oilmanagement.css";

export default function Oilmanagement() {
  const [activeForm, setActiveForm] = useState(null);

  const closeModal = () => setActiveForm(null);

  return (
    <div className="oil-dashboard">
      <Sidebar />

      <div className="oil-content">
        <h2>🛢️ Oil Management</h2>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={() => setActiveForm("tanker")}>
            🚚 Fill Tanker
          </button>
          <button onClick={() => setActiveForm("truck")}>
            🛢️ Fill Truck
          </button>
        </div>

        {/* ================= MODAL ================= */}
        {activeForm && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {activeForm === "tanker" && (
                <TankerFill onClose={closeModal} />
              )}

              {activeForm === "truck" && (
                <TruckFill onClose={closeModal} />
              )}
            </div>
          </div>
        )}

        {/* ================= RECORDS ================= */}
        <div className="records-section">
          <h3>📋 Tanker Records</h3>
          <TankerFill showRecordsOnly />

          <h3>📋 Truck Records</h3>
          <TruckFill showRecordsOnly />
        </div>
      </div>
    </div>
  );
}
