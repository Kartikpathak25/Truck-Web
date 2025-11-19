import './App.css';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Login.jsx';
import AdminDashboard from './Dashboard/AdminDashboard/AdminDashboard.jsx';
import UserManagement from './Pages/Modules/Usermanagement/Usermanagement.jsx';
import Fleetmanagement from './Pages/Modules/Fleetmanagement/Fleetmanagemenet.jsx';
import Oilmanagement from './Pages/Modules/Oilmanagement/Oilmanagement.jsx';
import Cityoperation from './Pages/Modules/Cityoperation/Cityoperation.jsx';
import TankerDashboard from './Dashboard/Tankerdashboard/TankerDashboard.jsx';
import Maintanance from './Pages/Modules/Maintananace/Maintanance.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route → Login */}
        <Route path="/" element={<Login />} />

        {/* Dashboard and modules */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/fleet" element={<Fleetmanagement />} />
        <Route path="/oil" element={<Oilmanagement />} />
        <Route path="/city" element={<Cityoperation />} />
        <Route path="/tanker-dashboard" element={<TankerDashboard />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path='/maintenance' element={<Maintanance />}/>

        {/* Agar galat route likhe to Login par redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
