import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuthStore } from '../store';
import { UploadCloud, CheckCircle2, Monitor, Users, Building, DollarSign } from 'lucide-react';
import './CreateTicket.css';

const DEPARTMENTS = [
  { id: '1', name: 'IT Support', icon: <Monitor size={20} strokeWidth={1.5} />, desc: 'Hardware, software, network' },
  { id: '2', name: 'Human Resources', icon: <Users size={20} strokeWidth={1.5} />, desc: 'Payroll, benefits, policies' },
  { id: '3', name: 'Facilities', icon: <Building size={20} strokeWidth={1.5} />, desc: 'Building, maintenance' },
  { id: '4', name: 'Finance', icon: <DollarSign size={20} strokeWidth={1.5} />, desc: 'Expenses, billing' }
];

export function CreateTicket() {
  const user = useAuthStore(state => state.user);
  const [step, setStep] = useState(1);
  const [selectedDept, setSelectedDept] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('low');
  const [category, setCategory] = useState('software');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !title || !description || !user?.id) return;
    
    setIsSubmitting(true);
    try {
      const res = await api.post('/tickets.php', {
        title,
        description,
        priority,
        category,
        department_id: selectedDept,
        creator_id: user.id
      });
      if (res.data && res.data.success) {
        alert('Ticket created successfully!');
        navigate('/tickets');
      } else {
        alert('Error: ' + res.data.error);
      }
    } catch (err: any) {
      alert('Error creating ticket: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-ticket">
      <div className="wizard-header">
        <h1>Create New Ticket</h1>
        <div className="steps-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-circle">1</div>
            <span>Department</span>
          </div>
          <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-circle">2</div>
            <span>Details</span>
          </div>
        </div>
      </div>

      <div className="wizard-content glass">
        {step === 1 && (
          <div className="step-1">
            <h2>Select Department</h2>
            <p>Which team can help you with your issue?</p>
            
            <div className="dept-grid">
              {DEPARTMENTS.map(dept => (
                <div 
                  key={dept.id} 
                  className={`dept-card ${selectedDept === dept.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDept(dept.id)}
                >
                  <div className="dept-icon">{dept.icon}</div>
                  <h3>{dept.name}</h3>
                  <p>{dept.desc}</p>
                  {selectedDept === dept.id && <CheckCircle2 size={20} strokeWidth={1.5} className="check-icon" />}
                </div>
              ))}
            </div>

            <div className="wizard-actions">
              <button 
                className="btn-primary" 
                disabled={!selectedDept}
                onClick={() => setStep(2)}
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-2">
            <h2>Ticket Details</h2>
            <p>Provide as much information as possible.</p>

            <form className="ticket-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Issue Title *</label>
                <input 
                  type="text" 
                  placeholder="Brief summary of the issue" 
                  required 
                  className="form-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select className="form-input" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="software">Software</option>
                    <option value="hardware">Hardware</option>
                    <option value="access">Access/Permissions</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea 
                  rows={6} 
                  placeholder="Detailed explanation of the issue..." 
                  required 
                  className="form-input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="form-group">
                <label>Attachments</label>
                <div 
                  className="file-upload-zone" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  style={{ cursor: 'pointer' }}
                >
                  <UploadCloud size={20} strokeWidth={1.5} />
                  <p id="file-name-display">Drag & drop files here, or click to select</p>
                  <small>Max file size: 10MB</small>
                  <input 
                    type="file" 
                    id="file-upload" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      const display = document.getElementById('file-name-display');
                      if (display && file) {
                        display.innerText = file.name;
                      }
                    }}
                  />
                </div>
              </div>

              <div className="wizard-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
