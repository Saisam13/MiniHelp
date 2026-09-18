import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreateTicket } from './pages/CreateTicket';
import { Kanban } from './pages/Kanban';
import { TicketList } from './pages/TicketList';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { useAuthStore } from './store';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const theme = useAuthStore(state => state.theme);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    let soundSettings: Record<string, string> = {
      'sound_low': '/notification.mp3',
      'sound_medium': '/notification.mp3',
      'sound_high': '/notification.mp3',
      'sound_critical': '/notification.mp3'
    };

    // Fetch latest sound settings
    fetch('/api/settings.php')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          soundSettings = { ...soundSettings, ...data.data };
        }
      }).catch(console.error);

    const playNotificationSound = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PLAY_SOUND') {
        const priority = event.data.priority || 'medium';
        const soundFile = soundSettings[`sound_${priority}`] || '/notification.mp3';
        const audio = new Audio(soundFile);
        audio.play().catch(e => console.error('Audio play failed:', e));
      }
    };

    navigator.serviceWorker?.addEventListener('message', playNotificationSound);
    return () => navigator.serviceWorker?.removeEventListener('message', playNotificationSound);
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="tickets" element={<TicketList />} />
          <Route path="tickets/new" element={<CreateTicket />} />
          <Route path="tickets/kanban" element={<Kanban />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
