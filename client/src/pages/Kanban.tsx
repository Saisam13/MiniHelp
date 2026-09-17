import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuthStore } from '../store';
import './Kanban.css';

export function Kanban() {
  const user = useAuthStore(state => state.user);
  const [tickets, setTickets] = useState<any[]>([]);
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Map backend statuses to columns
  const columns = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' }
  ];

  useEffect(() => {
    if (user) fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const url = `/tickets.php?role=${user.role}&user_id=${user.id}&department_id=${(user as any).department_id || ''}`;
      
      const res = await api.get(url);
      if (res.data && res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error('API Error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTicketId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedTicketId) return;

    // Optimistic update
    setTickets(tickets.map(t => 
      t.id === draggedTicketId ? { ...t, status: newStatus } : t
    ));
    setDraggedTicketId(null);

    // Backend update
    try {
      await api.patch(`/tickets.php?id=${draggedTicketId}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status in DB', err);
      // Revert on error
      fetchTickets();
    }
  };

  return (
    <div className="kanban-page">
      <div className="page-header">
        <h1>Kanban Board</h1>
        <p>Drag and drop tickets to update their status.</p>
      </div>

      <div className="kanban-board">
        {loading ? (
          <div style={{padding: '20px'}}>Loading tickets...</div>
        ) : (
          columns.map(col => (
            <div 
              key={col.key} 
              className="kanban-col glass"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <div className="col-header">
                <h3>{col.label}</h3>
                <span className="col-count">
                  {tickets.filter(t => (t.status || 'open') === col.key).length}
                </span>
              </div>
              <div className="col-content">
                {tickets.filter(t => (t.status || 'open') === col.key).map(ticket => (
                  <div 
                    key={ticket.id} 
                    className="kanban-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                  >
                    <div className="card-top">
                      <span className="mono ticket-id">{ticket.ticket_number || ticket.id}</span>
                      <span className={`priority-indicator p-${(ticket.priority || 'low').toLowerCase()}`}></span>
                    </div>
                    <h4>{ticket.title}</h4>
                    <div className="card-bottom">
                      <span className={`priority-badge priority-${(ticket.priority || 'low').toLowerCase()}`}>
                        {(ticket.priority || 'low').toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
