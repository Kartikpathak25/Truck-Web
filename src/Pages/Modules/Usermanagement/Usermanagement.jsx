import React, { useState } from 'react';
import AddUserModal from '../Usermanagement/CRUD/Add/Adduser';
import EditUserModal from '../Usermanagement/CRUD/Edit/Edituser';
import Sidebar from '../../../Component/Sidebar/Sidebar';
import './Usermanagement.css';

export default function UserManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([
    { name: 'John Admin', email: 'john@admin.com', initials: 'JA', LIC: '123456', MobNumber: '9876543210', password: 'pass123' },
    { name: 'Mike Wilson', email: 'mike@tanker.com', initials: 'MW', LIC: '654321', MobNumber: '9123456780', password: 'pass456' },
  ]);

  const handleAddUser = (newUserData) => {
    const initials = newUserData.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();

    const newUser = {
      ...newUserData,
      initials,
    };

    setUsers(prev => [...prev, newUser]);
    setShowModal(false);
  };

  const handleUpdateUser = (updatedUser) => {
    const updatedList = users.map(user =>
      user.email === updatedUser.email ? { ...updatedUser, initials: user.initials } : user
    );
    setUsers(updatedList);
    setEditUser(null);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="user-management-container">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <h2>User Management</h2>
          <button className="add-user-btn" onClick={() => setShowModal(true)}>+ Add New User</button>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={index}>
                <td>
                  <div className="user-info">
                    <div className="avatar">{user.initials}</div>
                    <div>
                      <strong>{user.name}</strong><br />
                      <span className="email">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>{user.LIC}</td>
                <td>{user.MobNumber}</td>
                <td>
                  <button className="edit" onClick={() => setEditUser(user)}>✏️ Edit</button>
                  <button className="delete">🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && (
          <AddUserModal
            onClose={() => setShowModal(false)}
            onSubmit={handleAddUser}
          />
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
