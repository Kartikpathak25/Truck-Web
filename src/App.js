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
import Maintanancereport from './Pages/Modules/Maintanancereport/Maintananacereport.jsx';
import ProtectedRoute from './Component/Sidebar/ProtectedRoute.jsx'; // ← UPDATED PATH

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔹 Login route */}
        <Route
          path="/"
          element={
            localStorage.getItem('loggedUser') ? (
              <Navigate to={
                JSON.parse(localStorage.getItem('loggedUser')).role === 'Admin'
                  ? '/admin-dashboard'
                  : '/tanker-dashboard'
              } replace />
            ) : (
              <Login />
            )
          }
        />

        {/* 🔹 Admin routes - Protected */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fleet"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Fleetmanagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/city"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Cityoperation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/oil"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Oilmanagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Maintanance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Report />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintanancereports"
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Maintanancereport />
            </ProtectedRoute>
          }
        />

        {/* ✅ Tanker routes - Protected */}
        <Route
          path="/tanker-dashboard"
          element={
            <ProtectedRoute allowedRoles={['Tanker', 'User']}>
              <TankerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tankeroil"
          element={
            <ProtectedRoute allowedRoles={['Tanker', 'User']}>
              <Oilmanagement2 />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tankermaintenance"
          element={
            <ProtectedRoute allowedRoles={['Tanker', 'User']}>
              <Maintanance2 />
            </ProtectedRoute>
          }
        />

        {/* 🔹 Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;