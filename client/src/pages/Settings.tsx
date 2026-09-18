import { useState, useEffect } from 'react';
import { api } from '../api';
import './Settings.css';
import { X, Trash2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code?: string;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New User state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department_id: ''
  });

  // New Department state
  const [isNewDeptModalOpen, setIsNewDeptModalOpen] = useState(false);
  const [newDept, setNewDept] = useState({
    name: '',
    code: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepts = async () => {
    try {
      const res = await api.get('/departments.php');
      if (res.data && res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error('API Error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users.php');
      if (res.data && res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('API Error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDepts(); // Always fetch departments to populate dropdowns
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/users.php', newUser);
      if (res.data && res.data.success) {
        setIsNewUserModalOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'employee', department_id: '' });
        fetchUsers();
        alert('User added successfully!');
      } else {
        alert(res.data?.error || 'Failed to add user.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to add user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/departments.php', newDept);
      if (res.data && res.data.success) {
        setIsNewDeptModalOpen(false);
        setNewDept({ name: '', code: '', description: '' });
        fetchDepts();
        alert('Department created successfully!');
      } else {
        alert(res.data?.error || 'Failed to create department.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to create department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm("Are you sure you want to delete all resolved and closed tickets older than 30 days? This action cannot be undone.")) return;
    
    setIsSubmitting(true);
    try {
      const res = await api.post('/cleanup.php?days=30', {});
      if (res.data && res.data.success) {
        alert(res.data.message || 'Cleanup completed successfully.');
      } else {
        alert('Cleanup failed: ' + res.data.error);
      }
    } catch (err: any) {
      alert('Cleanup error: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Administration</h1>
        <p>Premium workspace configuration, team management, and cleanup rules.</p>
      </div>

      <div className="settings-content glass">
        <div className="settings-sidebar">
          <ul className="settings-nav">
            <li className={activeTab === 'general' ? 'active' : ''} onClick={() => setActiveTab('general')}>General & Data</li>
            <li className={activeTab === 'departments' ? 'active' : ''} onClick={() => setActiveTab('departments')}>Departments</li>
            <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users & Roles</li>
          </ul>
        </div>

        <div className="settings-panel">
          {activeTab === 'general' && (
            <div>
              <div className="panel-header">
                <h2>General Settings & Cleanup</h2>
              </div>
              <div className="settings-card" style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Automatic Database Cleanup</h3>
                <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)' }}>
                  To save resources, the system automatically marks resolved/closed issues for deletion after 30 days. You can manually trigger a cleanup of all old database values and file attachments right now.
                </p>
                <button 
                  className="btn-primary" 
                  style={{ backgroundColor: '#e74c3c' }} 
                  onClick={handleCleanup}
                  disabled={isSubmitting}
                >
                  <Trash2 size={18} style={{ marginRight: '8px' }} />
                  {isSubmitting ? 'Cleaning...' : 'Delete Old Closed Tickets (> 30 days)'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div>
              <div className="panel-header">
                <h2>Departments</h2>
                <button className="btn-primary" onClick={() => setIsNewDeptModalOpen(true)}>Add Department</button>
              </div>
              
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3}>Loading...</td></tr>
                  ) : (
                    departments.map(dept => (
                      <tr key={dept.id}>
                        <td>{dept.name}</td>
                        <td>{dept.code || 'N/A'}</td>
                        <td>{dept.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="panel-header">
                <h2>Users & Roles</h2>
                <button className="btn-primary" onClick={() => setIsNewUserModalOpen(true)}>Add User</button>
              </div>
              
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4}>Loading...</td></tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{user.department || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New User Modal */}
      {isNewUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>Create New User Account</h2>
              <button className="icon-btn" onClick={() => setIsNewUserModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input required className="form-input" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input required type="email" className="form-input" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input required type="password" className="form-input" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select required className="form-input" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                    <option value="employee">Employee</option>
                    <option value="agent">Agent</option>
                    <option value="dept_head">Department Head</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department (Source of Truth)</label>
                  <select className="form-input" value={newUser.department_id} onChange={e => setNewUser({...newUser, department_id: e.target.value})}>
                    <option value="">None (Global)</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsNewUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Dept Modal */}
      {isNewDeptModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>Create New Department</h2>
              <button className="icon-btn" onClick={() => setIsNewDeptModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateDept}>
              <div className="form-group">
                <label>Department Name</label>
                <input required className="form-input" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Department Code (e.g. IT, HR)</label>
                <input required className="form-input" value={newDept.code} onChange={e => setNewDept({...newDept, code: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" rows={3} value={newDept.description} onChange={e => setNewDept({...newDept, description: e.target.value})}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsNewDeptModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
