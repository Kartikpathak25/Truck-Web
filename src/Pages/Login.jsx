// src/Pages/Login/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');   // email
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1️⃣ Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        username,
        password
      );

      const userId = userCredential.user.uid;

      // 2️⃣ Fetch user document from "users"
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (!userSnap.exists()) {
        alert('User document not found in Firestore!');
        setIsLoading(false);
        return;
      }

      const userData = userSnap.data();

      // 3️⃣ Fetch assigned vehicle / tanker by assignedId
      let vehicleData = null;

      if (userData.assignedType === 'Vehicle') {
        const vSnap = await getDoc(doc(db, 'trucks', userData.assignedId));
        if (vSnap.exists()) vehicleData = vSnap.data();
      } else if (userData.assignedType === 'Tanker') {
        const tSnap = await getDoc(doc(db, 'tankers', userData.assignedId));
        if (tSnap.exists()) vehicleData = tSnap.data();
      }

      // 4️⃣ Build final object saved in localStorage
      const mappedUser = {
        uid: userId,
        name: userData.name || '',
        email: userData.email || '',
        LIC: userData.LIC || '',
        MobNumber: userData.MobNumber || '',
        role: userData.role || '',
        assignedType: userData.assignedType || '',
        assignedId: userData.assignedId || '',

        // 👇 yahi fields Maintenance2.jsx use karega
        assignedTruckNumber: vehicleData?.truckNumber || '',
        assignedTruckModel: vehicleData?.model || '',
        driverName: vehicleData?.driverName || '',

        // optional extra fields (dashboard ke liye)
        capacity: vehicleData?.capacity || '',
        currentReading: vehicleData?.currentReading || '',
        location: vehicleData?.location || '',
        status: vehicleData?.status || '',
      };

      localStorage.setItem('loggedUser', JSON.stringify(mappedUser));

      // 5️⃣ Role based navigation
      if (mappedUser.role === 'Admin') {
        navigate('/admin-dashboard');
      } else if (mappedUser.role === 'Tanker' || mappedUser.role === 'User') {
        navigate('/tanker-dashboard');
      } else {
        alert('Role invalid! Please contact admin.');
      }
    } catch (err) {
      console.error(err);
      alert('You Are Entered Wrong id and password : Login Failed ❌ ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Truck Oil Management</h1>

      <div className="login-content">
        <div className="login-image">
          <img src="home.png" alt="Login" />
        </div>

        <div className="login-box">
          <h2>Welcome To The Login Page</h2>
          <p>Sign in to manage fleet operations</p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
