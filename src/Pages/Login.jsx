import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const userId = userCredential.user.uid;

      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        alert("User not found in database!");
        return;
      }

      const userData = userDoc.data();
      const role = userData.role;

      if (role === 'Tanker') {
        navigate('/tanker-dashboard');
      } else if (role === 'Admin') {
        navigate('/admin-dashboard');
      }
    } catch (error) {
      alert('Login failed ❌ ' + error.message);
    }
  };

  return (
    <div className="login-container">
      <h1>Truck Oil Management</h1>

      <div className="login-content">
        {/* Left side image */}
        <div className="login-image">
          <img src="home.png" alt="Login Illustration" />
        </div>

        {/* Right side login box */}
        <div className="login-box">
          <h2>Welcome To The Login Page</h2>
          <p>Sign in to manage the fleet and oil operations</p>

          {/* ✅ Single form only */}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Email</label>
              <input
                type="email"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="form-group">
              <a href="/forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="login-button">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
