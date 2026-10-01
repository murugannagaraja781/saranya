import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip
} from '@mui/material';
import {
  LayoutDashboard,
  MessageSquare,
  AlertTriangle,
  Users,
  PhoneCall,
  CheckSquare,
  Sparkles,
  Cpu,
  Settings as SettingsIcon,
  Bot
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobileDrawer: () => void;
  unreadAlertsCount?: number;
  pendingTasksCount?: number;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/messages', label: 'Messages', icon: MessageSquare },
  { path: '/alerts', label: 'Important Alerts', icon: AlertTriangle, badgeKey: 'alerts' },
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/calls', label: 'Call History', icon: PhoneCall },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare, badgeKey: 'tasks' },
  { path: '/instructions', label: 'AI Instructions', icon: Sparkles },
  { path: '/integrations', label: 'Integrations', icon: Cpu },
  { path: '/settings', label: 'Settings', icon: SettingsIcon }
];

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobileDrawer,
  unreadAlertsCount = 2,
  pendingTasksCount = 5
}) => {
  const location = useLocation();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 2 }}>
      {/* Brand Header */}
      <Box sx={{ px: 3, pb: 2.5, mb: 1, borderBottom: '1px solid #F1F5F9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <Bot size={22} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#0F172A', lineHeight: 1.2 }}>
              Saranya
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.72rem' }}>
              Personal Tamil AI Assistant
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 1.5, flex: 1 }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          let badgeCount = 0;
          if (item.badgeKey === 'alerts') badgeCount = unreadAlertsCount;
          if (item.badgeKey === 'tasks') badgeCount = pendingTasksCount;

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={onCloseMobileDrawer}
                sx={{
                  borderRadius: '10px',
                  py: 1.1,
                  px: 2,
                  backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                  color: isActive ? '#2563EB' : '#475569',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: isActive ? '#EFF6FF' : '#F8FAFC',
                    color: isActive ? '#2563EB' : '#0F172A'
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? '#2563EB' : '#64748B'
                  }}
                >
                  <Icon size={19} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.88rem',
                    fontWeight: isActive ? 700 : 500
                  }}
                />
                {badgeCount > 0 && (
                  <Chip
                    label={badgeCount}
                    size="small"
                    sx={{
                      height: 20,
                      minWidth: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: item.badgeKey === 'alerts' ? '#FEE2E2' : '#F1F5F9',
                      color: item.badgeKey === 'alerts' ? '#DC2626' : '#475569'
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Bottom Assistant Status Card */}
      <Box sx={{ px: 2, mt: 'auto' }}>
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
              Monitoring Active
            </Typography>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>
            Gmail (Clients) & WhatsApp Business connected. Spoken Tamil Chennai briefing ready.
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: 260 }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onCloseMobileDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 270,
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Persistent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 260,
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            top: 68,
            height: 'calc(100% - 68px)'
          }
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};
