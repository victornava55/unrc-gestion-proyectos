import React, { useEffect } from 'react';
import useAppStore from './store/useAppStore';
import useChatPolling from './hooks/useChatPolling';
import MainLayout from './components/layout/MainLayout';
import KanbanBoard from './components/kanban/KanbanBoard';
import SlackWorkspaceView from './components/chat/SlackWorkspaceView';
import ReportsAndHistoryView from './components/reports/ReportsAndHistoryView';

export default function App() {
  const fetchInitialData = useAppStore((s) => s.fetchInitialData);
  const isLoading = useAppStore((s) => s.isLoading);
  const activeView = useAppStore((s) => s.activeView);

  // Sincronización Inteligente Anti-bloqueo de Google Sheets (cada 12s solo si pestaña visible)
  const pollingStatus = useChatPolling(!isLoading);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <MainLayout>
      {isLoading ? (
        <div className="editorial-loading">
          <div className="editorial-loading__bar" />
          <span>HIDRATANDO TABLERO, CANALES Y BITÁCORA DESDE GOOGLE SHEETS...</span>
        </div>
      ) : activeView === 'KANBAN' ? (
        <KanbanBoard />
      ) : activeView === 'CHAT' ? (
        <SlackWorkspaceView pollingStatus={pollingStatus} />
      ) : (
        <ReportsAndHistoryView />
      )}
    </MainLayout>
  );
}
