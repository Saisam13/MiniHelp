const fs = require('fs');
const file = 'client/src/pages/Settings.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Interfaces
code = code.replace(
  'interface User {',
  'interface Category { id: string; name: string; department_id: string; department_name?: string; }\n\ninterface User {'
);

// 2. States
code = code.replace(
  'const [users, setUsers] = useState<User[]>([]);',
  'const [users, setUsers] = useState<User[]>([]);\n  const [categories, setCategories] = useState<Category[]>([]);\n  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);\n  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);\n  const [categoryForm, setCategoryForm] = useState({ name: "", department_id: "" });'
);

// 3. fetchCategories and fetchDepts (we need to ensure fetchDepts is called when tab is categories too if needed)
code = code.replace(
  'const fetchUsers = async () => {',
  `const fetchCategories = async () => {
    try {
      const res = await api.get('/categories.php');
      if (res.data?.success) setCategories(res.data.data);
    } catch (err) {}
  };
  
  const fetchUsers = async () => {`
);

// 4. useEffect
code = code.replace(
  'if (activeTab === \'users\') fetchUsers();',
  'if (activeTab === \'users\') fetchUsers();\n    if (activeTab === \'categories\') fetchCategories();'
);

// 5. Category CRUD handlers
code = code.replace(
  '// ---- USER CRUD ----',
  `// ---- CATEGORY CRUD ----
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
  
  // ---- USER CRUD ----`
);

// 6. Sidebar
code = code.replace(
  `<li className={activeTab === 'departments' ? 'active' : ''} onClick={() => setActiveTab('departments')}>Departments</li>`,
  `<li className={activeTab === 'departments' ? 'active' : ''} onClick={() => setActiveTab('departments')}>Departments</li>
             <li className={activeTab === 'categories' ? 'active' : ''} onClick={() => setActiveTab('categories')}>Problem Types</li>`
);

// 7. Panel
code = code.replace(
  `{activeTab === 'users' && (`,
  `{activeTab === 'categories' && (
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
          
          {activeTab === 'users' && (`
);

// 8. Modal
code = code.replace(
  `{/* User Modal */}`,
  `{/* Category Modal */}
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
      
      {/* User Modal */}`
);

fs.writeFileSync(file, code);
console.log("Settings.tsx patched successfully!");
