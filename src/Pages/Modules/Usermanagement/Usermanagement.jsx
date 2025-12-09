import React, { useState, useEffect } from 'react';
import AddUserModal from '../Usermanagement/CRUD/Add/Adduser';
import EditUserModal from '../Usermanagement/CRUD/Edit/Edituser';
import Sidebar from '../../../Component/Sidebar/Sidebar';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import './Usermanagement.css';

export default function UserManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);

  // 🔹 Fetch users from Firestore in realtime
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(data);
    });
    return () => unsub();
  }, []);

  // 🔹 Update user locally
  const handleUpdateUser = (updatedUser) => {
    const updatedList = users.map(user =>
      user.id === updatedUser.id ? { ...updatedUser } : user
    );
    setUsers(updatedList);
    setEditUser(null);
  };

  // 🔹 Delete user from Firestore
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(prev => prev.filter((u) => u.id !== userId));
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Check Firestore rules.");
    }
  };

  // 🔹 Search filter
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-management-container">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <h2>User Management</h2>
          <button className="add-user-btn" onClick={() => setShowModal(true)}>
            + Add New User
          </button>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <table className="user-table">
          <thead>
            <tr>
              <th>User</th>
              <th>LIC</th>
              <th>Mobile</th>
              <th>Assigned Type</th>
              <th>Assigned Model</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <div className="avatar">
                      {user.initials || user.name?.[0] || "?"}
                    </div>
                    <div>
                      <strong>{user.name || "Unnamed User"}</strong><br />
                      <span className="email">{user.email || "No Email"}</span>
                    </div>
                  </div>
                </td>
                <td>{user.LIC || "N/A"}</td>
                <td>{user.MobNumber || "N/A"}</td>
                <td>{user.assignedType || "N/A"}</td>
                <td>{user.assignedTruckModel || "N/A"}</td>
                <td>
                  <button className="edit" onClick={() => setEditUser(user)}>✏️ Edit</button>
                  <button className="delete" onClick={() => handleDeleteUser(user.id)}>🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && (
          <AddUserModal onClose={() => setShowModal(false)} />
        )}

        {editUser && (
          <EditUserModal
            userData={editUser}
            onClose={() => setEditUser(null)}
            onUpdate={handleUpdateUser}
          />
        )}
      </div>
    </div>
  );
}
