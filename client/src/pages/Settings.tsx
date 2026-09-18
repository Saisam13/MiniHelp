import { useState, useEffect } from 'react';
import { api } from '../api';
import './Settings.css';
import { X, Trash2, Edit } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code?: string;
  description: string;
}

interface Category { id: string; name: string; department_id: string; department_name?: string; }

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  department_id?: string;
}

export function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", department_id: "" });
  const [loading, setLoading] = useState(true);

  // User state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    name: '', email: '', password: '', role: 'employee', department_id: ''
  });

  // Department state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: '', code: '', description: ''
  });

  // Notifications state
  const [sounds, setSounds] = useState({
    sound_low: '/notification.mp3',
    sound_medium: '/notification.mp3',
    sound_high: '/notification.mp3',
    sound_critical: '/notification.mp3'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepts = async () => {
    try {
      const res = await api.get('/departments.php');
      if (res.data?.success) setDepartments(res.data.data);
    } catch (err) {}
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories.php');
      if (res.data?.success) setCategories(res.data.data);
    } catch (err) {}
  };
  
  const fetchUsers = async () => {
    try {
      const res = await api.get('/users.php');
      if (res.data?.success) setUsers(res.data.data);
    } catch (err) {}
  };

  const fetchSounds = async () => {
    try {
      const res = await api.get('/settings.php');
      if (res.data?.success && res.data.data) {
        setSounds(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (err) {}
  };

  useEffect(() => {
    setLoading(true);
    fetchDepts();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'notifications') fetchSounds();
    setLoading(false);
  }, [activeTab]);

  // ---- CATEGORY CRUD ----
  const openCategoryModal = (cat?: Category) => {
    if (cat) { setEditingCategoryId(cat.id); setCategoryForm({ name: cat.name, department_id: cat.department_id }); }
    else { setEditingCategoryId(null); setCategoryForm({ name: "", department_id: "" }); }
    setIsCategoryModalOpen(true);
  };
  
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCategoryId) {
        // Not implemented edit for categories for simplicity, let's just do delete/add or implement edit if needed
      } else {
        const res = await api.post('/categories.php', categoryForm);
        if (res.data?.success) { alert("Category added"); setIsCategoryModalOpen(false); fetchCategories(); }
        else alert(res.data?.error || 'Failed');
      }
    } catch (err) {}
    setIsSubmitting(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this problem type?')) return;
    try {
      const res = await api.delete('/categories.php?id=' + id);
      if (res.data?.success) fetchCategories();
      else alert(res.data?.error || 'Failed to delete');
    } catch(err) {}
  };
  
  // ---- USER CRUD ----
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUserId) {
        const res = await api.patch(`/users.php?id=${editingUserId}`, userForm);
        if (res.data?.success) {
          alert('User updated successfully!');
          setIsUserModalOpen(false);
          fetchUsers();
        } else alert(res.data?.error || 'Failed to update user.');
      } else {
        const res = await api.post('/users.php', userForm);
        if (res.data?.success) {
          alert('User added successfully!');
          setIsUserModalOpen(false);
          fetchUsers();
        } else alert(res.data?.error || 'Failed to add user.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await api.delete(`/users.php?id=${id}`);
      if (res.data?.success) fetchUsers();
      else alert(res.data?.error || 'Failed to delete');
    } catch (err: any) { alert(err.response?.data?.error || err.message); }
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUserId(user.id);
      setUserForm({ name: user.name, email: user.email, password: '', role: user.role, department_id: user.department_id || '' });
    } else {
      setEditingUserId(null);
      setUserForm({ name: '', email: '', password: '', role: 'employee', department_id: '' });
    }
    setIsUserModalOpen(true);
  };

  // ---- DEPT CRUD ----
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingDeptId) {
        const res = await api.patch(`/departments.php?id=${editingDeptId}`, deptForm);
        if (res.data?.success) {
          alert('Department updated successfully!');
          setIsDeptModalOpen(false);
          fetchDepts();
        } else alert(res.data?.error || 'Failed to update department.');
      } else {
        const res = await api.post('/departments.php', deptForm);
        if (res.data?.success) {
          alert('Department created successfully!');
          setIsDeptModalOpen(false);
          fetchDepts();
        } else alert(res.data?.error || 'Failed to create department.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      const res = await api.delete(`/departments.php?id=${id}`);
      if (res.data?.success) fetchDepts();
      else alert(res.data?.error || 'Failed to delete');
    } catch (err: any) { alert(err.response?.data?.error || err.message); }
  };

  const openDeptModal = (dept?: Department) => {
    if (dept) {
      setEditingDeptId(dept.id);
      setDeptForm({ name: dept.name, code: dept.code || '', description: dept.description || '' });
    } else {
      setEditingDeptId(null);
      setDeptForm({ name: '', code: '', description: '' });
    }
    setIsDeptModalOpen(true);
  };

  // ---- CLEANUP & SETTINGS ----
  const handleCleanup = async () => {
    if (!window.confirm("Are you sure you want to delete all resolved and closed tickets older than 30 days?")) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/cleanup.php?days=30', {});
      if (res.data?.success) alert(res.data.message);
      else alert('Cleanup failed: ' + res.data.error);
    } catch (err: any) { alert(err.response?.data?.error || err.message); } finally { setIsSubmitting(false); }
  };

  const handleSaveSounds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/settings.php', sounds);
      if (res.data?.success) alert('Notification sounds saved successfully!');
      else alert('Failed to save sounds.');
    } catch (err: any) { alert(err.response?.data?.error || err.message); } finally { setIsSubmitting(false); }
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
             <li className={activeTab === 'categories' ? 'active' : ''} onClick={() => setActiveTab('categories')}>Problem Types</li>
            <li className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users & Roles</li>
            <li className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>Notifications</li>
          </ul>
        </div>

        <div className="settings-panel">
          {activeTab === 'general' && (
            <div>
              <div className="panel-header"><h2>General Settings & Cleanup</h2></div>
              <div className="settings-card" style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Automatic Database Cleanup</h3>
                <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)' }}>
                  To save resources, the system automatically marks resolved/closed issues for deletion after 30 days. You can manually trigger a cleanup of all old database values and file attachments right now.
                </p>
                <button className="btn-primary" style={{ backgroundColor: '#e74c3c' }} onClick={handleCleanup} disabled={isSubmitting}>
                  <Trash2 size={18} style={{ marginRight: '8px' }} />
                  {isSubmitting ? 'Cleaning...' : 'Delete Old Closed Tickets (> 30 days)'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <div className="panel-header"><h2>Custom Notification Sounds</h2></div>
              <form onSubmit={handleSaveSounds} className="settings-card" style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)' }}>Set a custom URL or relative path (like `/notification.mp3`) for each priority level.</p>
                
                {['low', 'medium', 'high', 'critical'].map((priority) => (
                  <div className="form-group" key={priority}>
                    <label style={{ textTransform: 'capitalize' }}>{priority} Priority Sound URL</label>
                    <input 
                      className="form-input" 
                      value={(sounds as any)[`sound_${priority}`]} 
                      onChange={(e) => setSounds({...sounds, [`sound_${priority}`]: e.target.value})}
                    />
                  </div>
                ))}

                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Sound Settings'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'departments' && (
            <div>
              <div className="panel-header">
                <h2>Departments</h2>
                <button className="btn-primary" onClick={() => openDeptModal()}>Add Department</button>
              </div>
              <div className="table-responsive">
                <table className="settings-table">
                  <thead><tr><th>Name</th><th>Code</th><th>Description</th><th style={{ width: '100px' }}>Actions</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={4}>Loading...</td></tr> : departments.map(dept => (
                      <tr key={dept.id}>
                        <td>{dept.name}</td><td>{dept.code || 'N/A'}</td><td>{dept.description}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="icon-btn" onClick={() => openDeptModal(dept)}><Edit size={16} /></button>
                            <button className="icon-btn text-danger" onClick={() => handleDeleteDept(dept.id)}><Trash2 size={16} color="var(--status-open)" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <div className="panel-header">
                <h2>Problem Types (Categories)</h2>
                <button className="btn-primary" onClick={() => openCategoryModal()}>Add Type</button>
              </div>
              <div className="table-responsive">
                <table className="settings-table">
                  <thead><tr><th>Name</th><th>Department</th><th style={{ width: '100px' }}>Actions</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={3}>Loading...</td></tr> : categories.map(cat => (
                      <tr key={cat.id}>
                        <td>{cat.name}</td><td>{cat.department_name}</td>
                        <td>
                          <button className="icon-btn text-danger" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={16} color="var(--status-open)" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'users' && (
            <div>
              <div className="panel-header">
                <h2>Users & Roles</h2>
                <button className="btn-primary" onClick={() => openUserModal()}>Add User</button>
              </div>
              <div className="table-responsive">
                <table className="settings-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th style={{ width: '100px' }}>Actions</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={5}>Loading...</td></tr> : users.map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td><td>{user.email}</td>
                        <td><span className={`role-badge role-${user.role?.toLowerCase()}`}>{user.role}</span></td>
                        <td>{user.department || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="icon-btn" onClick={() => openUserModal(user)}><Edit size={16} /></button>
                            <button className="icon-btn text-danger" onClick={() => handleDeleteUser(user.id)}><Trash2 size={16} color="var(--status-open)" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>Add Problem Type</h2>
              <button className="icon-btn" onClick={() => setIsCategoryModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label>Department</label>
                <select required className="form-input" value={categoryForm.department_id} onChange={e => setCategoryForm({...categoryForm, department_id: e.target.value})}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Problem Type Name (e.g. Hardware Issue)</label>
                <input required className="form-input" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Add Type'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* User Modal */}
      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>{editingUserId ? 'Edit User Account' : 'Create New User Account'}</h2>
              <button className="icon-btn" onClick={() => setIsUserModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input required className="form-input" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input required type="email" className="form-input" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Password {editingUserId ? '(Leave blank to keep current)' : ''}</label>
                <input type="password" required={!editingUserId} className="form-input" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select required className="form-input" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                    <option value="employee">Employee</option>
                    <option value="agent">Agent</option>
                    <option value="dept_head">Department Head</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department (Source of Truth)</label>
                  <select className="form-input" value={userForm.department_id} onChange={e => setUserForm({...userForm, department_id: e.target.value})}>
                    <option value="">None (Global)</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dept Modal */}
      {isDeptModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>{editingDeptId ? 'Edit Department' : 'Create New Department'}</h2>
              <button className="icon-btn" onClick={() => setIsDeptModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveDept}>
              <div className="form-group">
                <label>Department Name</label>
                <input required className="form-input" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Department Code (e.g. IT, HR)</label>
                <input required className="form-input" value={deptForm.code} onChange={e => setDeptForm({...deptForm, code: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" rows={3} value={deptForm.description} onChange={e => setDeptForm({...deptForm, description: e.target.value})}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsDeptModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Department'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

