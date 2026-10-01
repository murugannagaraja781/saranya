import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/common/AppLayout';

import { DashboardPage } from './pages/DashboardPage';
import { MessagesPage } from './pages/MessagesPage';
import { AlertsPage } from './pages/AlertsPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { CallsPage } from './pages/CallsPage';
import { TasksPage } from './pages/TasksPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="clients/:id" element={<ClientDetailPage />} />
                <Route path="calls" element={<CallsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="instructions" element={<InstructionsPage />} />
                <Route path="integrations" element={<IntegrationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
