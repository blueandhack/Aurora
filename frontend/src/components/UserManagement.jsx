import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

function UserManagement({ onRefresh }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers(filters);
      setUsers(response.users);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleRoleFilter = (e) => {
    setFilters({ ...filters, role: e.target.value, page: 1 });
  };

  const handleUserSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;

    const confirmMessage = {
      activate: 'activate selected users',
      deactivate: 'deactivate selected users',
      delete: 'permanently delete selected users'
    }[action];

    if (!window.confirm(`Are you sure you want to ${confirmMessage}?`)) {
      return;
    }

    try {
      await adminService.bulkUserOperation(action, selectedUsers);
      setSelectedUsers([]);
      loadUsers();
      onRefresh();
    } catch (err) {
      console.error('Bulk operation failed:', err);
      setError(`Failed to ${action} users`);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await adminService.updateUser(userId, updates);
      setEditingUser(null);
      loadUsers();
      onRefresh();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      loadUsers();
      onRefresh();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getRoleBadgeColor = (role) => {
    return role === 'admin' ? '#dc3545' : '#28a745';
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ margin: 0 }}>User Management</h2>
        <button 
          onClick={loadUsers}
          className="btn btn-secondary"
          style={{ padding: '8px 16px' }}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          alignItems: 'end'
        }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="search">Search Users</label>
            <input
              type="text"
              id="search"
              placeholder="Username or email..."
              value={filters.search}
              onChange={handleSearch}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="role">Filter by Role</label>
            <select
              id="role"
              value={filters.role}
              onChange={handleRoleFilter}
            >
              <option value="">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="card" style={{ 
          marginBottom: '1rem', 
          background: '#f8f9fa',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <span style={{ fontWeight: 'bold' }}>
              {selectedUsers.length} user(s) selected
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleBulkAction('activate')}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.9rem' }}
              >
                ✅ Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.9rem' }}
              >
                ⏸️ Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.9rem',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Last Login</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px' }}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserSelect(user._id)}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>{user.email}</div>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: getRoleBadgeColor(user.role),
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: user.isActive ? '#28a745' : '#6c757d',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                  {formatDate(user.createdAt)}
                </td>
                <td style={{ padding: '12px', fontSize: '0.9rem' }}>
                  {formatDate(user.lastLogin)}
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setEditingUser(user)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div style={{ 
            padding: '1rem', 
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setFilters({ ...filters, page })}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #dee2e6',
                  background: page === pagination.current ? '#007bff' : 'white',
                  color: page === pagination.current ? 'white' : '#333',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleUpdateUser}
          onCancel={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ user, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user._id, formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ 
        width: '400px',
        maxWidth: '90vw',
        background: 'white'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Edit User</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              Active Account
            </label>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserManagement;