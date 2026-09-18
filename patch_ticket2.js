const fs = require('fs');
const file = 'client/src/pages/CreateTicket.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. imports and setup
code = code.replace(
  "import { UploadCloud, CheckCircle2, Monitor, Users, Building, DollarSign } from 'lucide-react';",
  "import { UploadCloud, CheckCircle2, Briefcase } from 'lucide-react';\nimport { useEffect } from 'react';"
);

// 2. Remove hardcoded departments
code = code.replace(
  /const DEPARTMENTS = \[[\s\S]*?\];/g,
  ""
);

// 3. Add state for departments and categories
code = code.replace(
  "const [selectedDept, setSelectedDept] = useState('');",
  "const [selectedDept, setSelectedDept] = useState('');\n  const [departments, setDepartments] = useState<any[]>([]);\n  const [categories, setCategories] = useState<any[]>([]);"
);

// 4. Load departments on mount
code = code.replace(
  "const navigate = useNavigate();",
  `const navigate = useNavigate();

  useEffect(() => {
    api.get('/departments.php').then(res => {
      if (res.data?.success) setDepartments(res.data.data);
    });
  }, []);
`
);

// 5. When department selected, load categories
code = code.replace(
  "const res = await api.get(`/fields.php?department_id=${selectedDept}`);",
  `const res = await api.get(\`/fields.php?department_id=\${selectedDept}\`);
      const catRes = await api.get(\`/categories.php?department_id=\${selectedDept}\`);
      if (catRes.data?.success) {
        setCategories(catRes.data.data);
        if (catRes.data.data.length > 0) {
          setCategory(catRes.data.data[0].name);
        } else {
          setCategory('General');
        }
      }`
);

// 6. Map dynamic departments in Step 1
const oldLoop = `{DEPARTMENTS.map(dept => (
                  <div 
                    key={dept.id} 
                    className={\`dept-card \${selectedDept === dept.id ? 'selected' : ''}\`}
                    onClick={() => setSelectedDept(dept.id)}
                  >
                    <div className="dept-icon">{dept.icon}</div>
                    <h3>{dept.name}</h3>
                    <p>{dept.desc}</p>
                    {selectedDept === dept.id && <CheckCircle2 size={20} strokeWidth={1.5} className="check-icon" />}
                  </div>
                ))}`;

const newLoop = `{departments.map(dept => (
                  <div 
                    key={dept.id} 
                    className={\`dept-card \${selectedDept === dept.id ? 'selected' : ''}\`}
                    onClick={() => setSelectedDept(dept.id)}
                  >
                    <div className="dept-icon"><Briefcase size={20} strokeWidth={1.5} /></div>
                    <h3>{dept.name}</h3>
                    <p>{dept.description || 'General inquiries'}</p>
                    {selectedDept === dept.id && <CheckCircle2 size={20} strokeWidth={1.5} className="check-icon" />}
                  </div>
                ))}`;
code = code.replace(oldLoop, newLoop);

// 7. Update Category dropdown in Step 2
const oldCategoryHtml = `<div className="form-group">
                <label>Category</label>
                <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="software">Software</option>
                  <option value="hardware">Hardware</option>
                  <option value="network">Network & Internet</option>
                  <option value="access">Access & Accounts</option>
                  <option value="other">Other</option>
                </select>
              </div>`;

const newCategoryHtml = `<div className="form-group">
                <label>Problem Type / Category</label>
                <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.length > 0 ? (
                    categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                  ) : (
                    <option value="General">General Issue</option>
                  )}
                </select>
              </div>`;
code = code.replace(oldCategoryHtml, newCategoryHtml);

fs.writeFileSync(file, code);
console.log("CreateTicket.tsx patched successfully!");
