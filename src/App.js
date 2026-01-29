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
import Oilmanagement2 from './Dashboard/Tankerdashboard/Module2/Oilmanagement2.jsx';
import Maintanance2 from './Dashboard/Tankerdashboard/Module2/Maintanance2.jsx';
import Report from './Pages/Modules/Reportdashboard/Report.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔹 Default route → Login */}
        <Route path="/" element={<Login />} />

        {/* 🔹 Admin Dashboard routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/fleet" element={<Fleetmanagement />} />
        <Route path="/city" element={<Cityoperation />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/oil" element={<Oilmanagement />} />
        <Route path="/maintenance" element={<Maintanance />} />
        <Route path='/reports' element={<Report />} />

        {/* ✅ Tanker Dashboard */}
        <Route path="/tanker-dashboard" element={<TankerDashboard />} />

        {/* ✅ Tanker pages as top-level routes */}
        <Route path="/tankeroil" element={<Oilmanagement2 />} />
        <Route path="/tankermaintenance" element={<Maintanance2 />} />
        {/* 🔹 Catch-all → redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
