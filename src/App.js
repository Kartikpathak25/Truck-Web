
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Pages/Login.jsx';
import AdminDashboard from './Dashboard/AdminDashboard/AdminDashboard.jsx';
import UserManagement from './Pages/Modules/Usermanagement/Usermanagement.jsx';
import Fleetmanagement from './Pages/Modules/Fleetmanagement/Fleetmanagemenet.jsx';
import Oilmanagement from './Pages/Modules/Oilmanagement/Oilmanagement.jsx';
import Cityoperation from './Pages/Modules/Cityoperation/Cityoperation.jsx';
import TankerDashboard from './Dashboard/Tankerdashboard/TankerDashboard.jsx';

function App() {
  return (

    <Router>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/fleet" element={<Fleetmanagement />} />
        <Route path="/oil" element={<Oilmanagement />} />
        <Route path="/city" element={<Cityoperation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/tanker-dashboard" element={<TankerDashboard />} />
        <Route path="/users" element={<UserManagement />} />
        {/* <Route path='/Truckfill' element={<Truckfill/>}/>          */}
      </Routes>
    </Router>
  );
}

export default App;
