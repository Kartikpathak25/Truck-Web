import React, { useState } from "react";
import Sidebar from "../../../Component/Sidebar/Sidebar2/Sidebar2";
import TankerFill from "../../../Pages/Modules/Oilmanagement/operation/TankerFill/TankerFill";
import TruckFill from "../../../Pages/Modules/Oilmanagement/operation/TruckFill/TruckFill";
import "./Oilmanagement2.css";


export default function Oilmanagement2() {
  const [activeForm, setActiveForm] = useState(null);

  return (
    <div className="oil-dashboard">
      <Sidebar />

      <div className="oil-content">
        <h2>🛢️ Oil Management</h2>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={() => setActiveForm("tanker")}>
            🚚  Fill Truck  
          </button>
          <button onClick={() => setActiveForm("truck")}>
            🛢️ Fill Tanker
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
