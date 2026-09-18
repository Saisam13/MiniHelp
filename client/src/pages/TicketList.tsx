import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import './TicketList.css';
import { Search, Filter, MessageSquare, X, Send } from 'lucide-react';
import { useAuthStore } from '../store';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  department_id: string;
  created_at: string;
  assigned_to?: string;
}

export function TicketList() {
  const user = useAuthStore(state => state.user);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Chat slide-out state
  const [activeTicketChat, setActiveTicketChat] = useState<string | null>(null);
  const [activeTicketDetails, setActiveTicketDetails] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');



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

  const fetchComments = async (ticketId: string) => {
    setChatLoading(true);
    try {
      const [commentsRes, ticketRes] = await Promise.all([
        api.get(`/comments.php?ticket_id=${ticketId}`),
        api.get(`/tickets.php?id=${ticketId}`)
      ]);
      
      if (commentsRes.data && commentsRes.data.success) {
        setComments(commentsRes.data.data);
      } else {
        setComments([]);
      }
      
      if (ticketRes.data && ticketRes.data.success) {
        setActiveTicketDetails(ticketRes.data.data);
      }
    } catch (err) {
      console.error('API Error fetching details', err);
      setComments([]);
      setActiveTicketDetails(null);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTicketChat) {
      fetchComments(activeTicketChat);
    } else {
      setActiveTicketDetails(null);
      setComments([]);
    }
  }, [activeTicketChat]);

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

  const handleSendComment = async () => {
    if (newComment.trim() && activeTicketChat && user) {
      try {
        const res = await api.post('/comments.php', {
          ticket_id: activeTicketChat,
          user_id: user.id,
          content: newComment.trim()
        });
        if (res.data && res.data.success) {
          setNewComment('');
          fetchComments(activeTicketChat);
        }
      } catch (err) {
        console.error('API Error sending comment', err);
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (activeTicketChat) {
      try {
        await api.patch(`/tickets.php?id=${activeTicketChat}`, { status: newStatus });
        fetchTickets();
      } catch (err) {
        console.error('API Error updating status', err);
      }
    }
  };

  return (
    <div className="pulse-board">
      <div className="board-header">
        <div>
          <h1>Issue Tracker</h1>
          <p>Main workspace / IT Department</p>
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
          <h2>This Month</h2>
          <span className="count-badge">{tickets.length} items</span>
        </div>

        <div className="pulse-table-container">
          <table className="pulse-table">
            <thead>
              <tr>
                <th className="cell-checkbox"><input type="checkbox" /></th>
                <th className="cell-item">Item</th>
                <th className="cell-person">Owner</th>
                <th className="cell-status">Status</th>
                <th className="cell-priority">Priority</th>
                <th className="cell-date">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
              ) : (
                tickets.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t as any).ticket_number?.toLowerCase().includes(searchQuery.toLowerCase())).map(ticket => (
                  <tr key={ticket.id} className="pulse-row">
                    <td className="cell-checkbox"><input type="checkbox" /></td>
                    <td className="cell-item">
                      <div className="item-title">
                        <span>{ticket.title}</span>
                        <MessageSquare 
                          size={20} strokeWidth={1.5}
                          className="chat-icon" 
                          onClick={() => setActiveTicketChat(ticket.id)}
                        />
                      </div>
                    </td>
                    <td className="cell-person">
                      <div className="person-avatar">
                        {ticket.assigned_to ? ticket.assigned_to.charAt(0) : 'U'}
                      </div>
                    </td>
                    <td className="cell-status" style={{ position: 'relative' }}>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chat Slide-out Panel */}
      <div className={`chat-slide-panel ${activeTicketChat ? 'open' : ''}`}>
        <div className="chat-header">
          <div>
            <h3>Updates for {activeTicketChat}</h3>
            {user?.role === 'admin' && (
              <select 
                className="form-input" 
                style={{ marginTop: '10px', padding: '4px 8px' }}
                onChange={(e) => handleStatusChange(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Change Status...</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            )}
          </div>
          <button className="icon-btn" onClick={() => setActiveTicketChat(null)}>
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="chat-content">
          {activeTicketDetails && (
            <div className="ticket-original-details" style={{ padding: '20px', borderBottom: '1px solid var(--border)', marginBottom: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', margin: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>{activeTicketDetails.title}</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {activeTicketDetails.description}
              </p>

              {activeTicketDetails.custom_fields && activeTicketDetails.custom_fields.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--text-primary)' }}>Custom Fields</h5>
                  {activeTicketDetails.custom_fields.map((cf: any, i: number) => (
                    <div key={i} style={{ marginBottom: '6px', fontSize: '0.8rem' }}>
                      <strong style={{ color: 'var(--text-secondary)' }}>{cf.field_label}: </strong> 
                      <span style={{ color: 'var(--text-primary)' }}>{cf.field_value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <span><strong>Priority:</strong> {activeTicketDetails.priority?.toUpperCase()}</span>
                <span><strong>Dept:</strong> {activeTicketDetails.department_name}</span>
                <span><strong>Creator:</strong> {activeTicketDetails.creator_name}</span>
                {activeTicketDetails.queue_position && (
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                    <strong>Queue Position:</strong> #{activeTicketDetails.queue_position}
                  </span>
                )}
              </div>
            </div>
          )}

          {chatLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Loading details...</div>
          ) : comments.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No comments yet.</div>
          ) : (
            comments.map((comment: any) => (
              <div className="dummy-comment" key={comment.id}>
                <div className="avatar">{comment.author_name ? comment.author_name.charAt(0).toUpperCase() : 'U'}</div>
                <div className="comment-body">
                  <div className="comment-meta">
                    <span className="author">{comment.author_name || 'User'}</span>
                    <span className="time">{comment.created_at}</span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="chat-input-area">
          <textarea 
            placeholder="Write an update..." 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <button className="btn-primary send-btn" onClick={handleSendComment}>
            <Send size={20} strokeWidth={1.5} /> Send
          </button>
        </div>
      </div>
      {activeTicketChat && (
        <div className="chat-overlay" onClick={() => setActiveTicketChat(null)}></div>
      )}
    </div>
  );
}
