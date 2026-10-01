import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SimulateMessageDialog } from './SimulateMessageDialog';
import { DashboardNotification } from '../../types/shared';
import { api } from '../../services/api';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

  const handleToggleMobileDrawer = () => {
    setMobileOpen(prev => !prev);
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Top Header */}
      <Header
        onToggleMobileDrawer={handleToggleMobileDrawer}
        onOpenSimulateDialog={() => setSimulateOpen(true)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
      />

      {/* Navigation Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobileDrawer={() => setMobileOpen(false)}
        unreadAlertsCount={2}
        pendingTasksCount={5}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - 260px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Toolbar /> {/* Spacer for sticky header */}
        <Outlet context={{ onOpenSimulate: () => setSimulateOpen(true) }} />
      </Box>

      {/* Simulate Inbound Client Message Dialog */}
      <SimulateMessageDialog
        open={simulateOpen}
        onClose={() => setSimulateOpen(false)}
        onSuccess={() => {
          // Trigger reload if needed
        }}
      />
    </Box>
  );
};
