import React, { useState } from "react";
import Sidebar from "../../../Component/Sidebar/Sidebar";
import TankerFill from "../../../Pages/Modules/Oilmanagement/operation/TankerFill/TankerFill";
import TruckFill from "../../../Pages/Modules/Oilmanagement/operation/TruckFill/TruckFill";
import "./Oilmanagement.css";


export default function Oilmanagement() {
  const [activeForm, setActiveForm] = useState(null);

  return (
    <div className="oil-dashboard">
      <Sidebar />

      <div className="oil-content">
        <h2>🛢️ Oil Management</h2>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={() => setActiveForm("tanker")}>
            🚚  Filled Tanker :
          </button>
          <button onClick={() => setActiveForm("truck")}>
            🛢️ Filled Truck :
          </button>
        </div>

        {/* Show Form in Modal */}
        {activeForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              {activeForm === "tanker" && (
                <TankerFill onClose={() => setActiveForm(null)} />
              )}
             {activeForm === "truck" && (
  <TruckFill onClose={() => setActiveForm(null)} />
)}

            </div>
          </div>
        )}

        {/* Records Section */}
        <div className="records-section">
          <TankerFill showRecordsOnly={true} />
          <TruckFill showRecordsOnly={true} />
        </div>
      </div>
    </div>
  );
}
