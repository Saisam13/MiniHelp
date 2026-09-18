import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import './TicketList.css';
import { Search, Filter, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../store';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  department_id: string;
  created_at: string;
  assigned_to?: string;
  ticket_number?: string;
}

export function TicketList() {
  const user = useAuthStore(state => state.user);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const url = `/tickets.php?role=${user.role}&user_id=${user.id}&department_id=${(user as any).department_id || ''}`;
      
      const res = await api.get(url);
      if (res.data && res.data.success) {
        setTickets(res.data.data);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error('API Error', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'closed':
        return 'status-done';
      case 'in_progress':
        return 'status-working';
      case 'open':
        return 'status-stuck';
      default:
        return 'status-default';
    }
  };

  return (
    <div className="ticket-list-page">
      <div className="board-header">
        <div>
          <h1>Pulse Board</h1>
          <p>Main workspace</p>
        </div>
        <div className="board-actions">
          <button className="btn-secondary"><Filter size={20} strokeWidth={1.5} /> Filter</button>
          <button className="btn-primary" onClick={() => navigate('/tickets/new')}>New Item</button>
        </div>
      </div>

      <div className="board-controls">
        <div className="search-bar">
          <Search size={20} strokeWidth={1.5} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="board-group glass">
        <div className="group-header">
          <div className="group-color-indicator" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
          <h2>All Tickets</h2>
          <span className="count-badge">{tickets.length} items</span>
        </div>

        <div className="pulse-table-container">
          <table className="pulse-table">
            <thead>
              <tr>
                <th className="cell-item">Item Title</th>
                <th className="cell-person">Owner</th>
                <th className="cell-status">Status</th>
                <th className="cell-priority">Priority</th>
                <th className="cell-date">Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
              ) : (
                tickets.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.ticket_number || '').toLowerCase().includes(searchQuery.toLowerCase())).map(ticket => (
                  <tr key={ticket.id} className="pulse-row" style={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${ticket.id}`)}>
                    <td className="cell-item">
                      <div className="item-title">
                        <span>{ticket.title}</span>
                      </div>
                    </td>
                      <td className="cell-person">
                        <div className="person-avatar">
                          {ticket.assignee_avatar ? (
                            <img src={ticket.assignee_avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            ticket.assignee_name ? ticket.assignee_name.charAt(0).toUpperCase() : 'U'
                          )}
                        </div>
                      </td>
                    <td className="cell-status" style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <div className={`status-pill ${getStatusColor(ticket.status || 'open')}`}>
                        {(ticket.status || 'open').toUpperCase().replace('_', ' ')}
                        <div className="corner-fold"></div>
                      </div>
                      {user?.role === 'admin' && (
                        <select 
                          style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            opacity: 0, cursor: 'pointer'
                          }}
                          value={ticket.status || 'open'}
                          onChange={(e) => {
                            api.patch(`/tickets.php?id=${ticket.id}`, { status: e.target.value })
                              .then(() => fetchTickets());
                          }}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      )}
                    </td>
                    <td className="cell-priority">
                      <div className={`status-pill ${getStatusColor(ticket.priority || 'low')}`}>
                        {(ticket.priority || 'low').toUpperCase()}
                      </div>
                    </td>
                    <td className="cell-date">{new Date(ticket.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/tickets/${ticket.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                        <ExternalLink size={20} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
