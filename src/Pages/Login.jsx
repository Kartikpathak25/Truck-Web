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
      // 🔹 Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const userId = userCredential.user.uid;

      // 🔹 Firestore se role fetch
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        alert("User not found in database!");
        return;
      }

      const userData = userDoc.data();
      const role = userData.role;

      // 🔹 Redirect based on role
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
      <div className="login-box">
        <h2>Welcome To The Login Page</h2>
        <p>Sign in to manage the fleet and oil operations</p>
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
              placeholder='Password'
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
  );
};

export default Login;
