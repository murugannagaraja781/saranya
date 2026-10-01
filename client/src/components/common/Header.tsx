import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  InputBase,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search,
  Bell,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardNotification } from '../../types/shared';

interface HeaderProps {
  onToggleMobileDrawer: () => void;
  onOpenSimulateDialog: () => void;
  notifications: DashboardNotification[];
  onMarkNotificationRead: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileDrawer,
  onOpenSimulateDialog,
  notifications = [],
  onMarkNotificationRead
}) => {
  const { user } = useAuth();
  const [anchorNotif, setAnchorNotif] = useState<null | HTMLElement>(null);
  const [anchorProfile, setAnchorProfile] = useState<null | HTMLElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        color: '#0F172A',
        zIndex: theme => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 }, minHeight: 68 }}>
        {/* Left: Mobile hamburger & App Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={onToggleMobileDrawer}
            sx={{ display: { md: 'none' }, color: '#475569' }}
            aria-label="Open menu drawer"
          >
            <MenuIcon size={22} />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              N
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontFamily: 'Outfit, sans-serif',
                fontSize: { xs: '1.05rem', md: '1.25rem' },
                color: '#0F172A',
                letterSpacing: '-0.02em'
              }}
            >
              Naga AI Assistant
            </Typography>
          </Box>

          {/* AI Status Badge */}
          <Chip
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
                  ml: 1
                }}
              />
            }
            label="Saranya Online"
            size="small"
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              fontWeight: 700,
              fontSize: '0.74rem',
              border: '1px solid #A7F3D0',
              height: 26,
              ml: 1
            }}
          />
        </Box>

        {/* Center: Global Search */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            backgroundColor: '#F1F5F9',
            borderRadius: '10px',
            px: 2,
            py: 0.6,
            width: 320,
            border: '1px solid #E2E8F0',
            transition: 'all 0.2s ease',
            '&:focus-within': {
              backgroundColor: '#FFFFFF',
              borderColor: '#2563EB',
              boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)'
            }
          }}
        >
          <Search size={18} color="#94A3B8" />
          <InputBase
            placeholder="Search clients, messages, calls..."
            sx={{ ml: 1.5, flex: 1, fontSize: '0.875rem', color: '#0F172A' }}
          />
        </Box>

        {/* Right: Actions, Notifications, Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Sparkles size={16} />}
            onClick={onOpenSimulateDialog}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              backgroundColor: '#2563EB',
              fontSize: '0.8rem',
              px: 1.8,
              py: 0.8
            }}
          >
            Simulate Client Reply
          </Button>

          {/* Notifications Button */}
          <Tooltip title="Notifications">
            <IconButton
              onClick={e => setAnchorNotif(e.currentTarget)}
              sx={{ color: '#475569', p: 1 }}
              aria-label="View notifications"
            >
              <Badge badgeContent={unreadCount} color="error" overlap="circular">
                <Bell size={20} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notifications Popover */}
          <Menu
            anchorEl={anchorNotif}
            open={Boolean(anchorNotif)}
            onClose={() => setAnchorNotif(null)}
            PaperProps={{
              sx: {
                width: 360,
                maxHeight: 450,
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                p: 1
              }
            }}
          >
            <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Notifications ({unreadCount} new)
              </Typography>
            </Box>
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', color: '#64748B' }}>
                <Typography variant="body2">No notifications yet.</Typography>
              </Box>
            ) : (
              notifications.map(n => (
                <MenuItem
                  key={n.id}
                  onClick={() => {
                    onMarkNotificationRead(n.id);
                    setAnchorNotif(null);
                  }}
                  sx={{
                    borderRadius: '8px',
                    my: 0.5,
                    p: 1.5,
                    whiteSpace: 'normal',
                    backgroundColor: n.isRead ? 'transparent' : '#F0FDF4'
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                      {n.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25 }}>
                      {n.message}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>

          {/* User Profile */}
          <Box
            onClick={e => setAnchorProfile(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              cursor: 'pointer',
              p: 0.5,
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#F8FAFC' }
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                backgroundColor: '#1E293B',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              N
            </Avatar>
            <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1, color: '#0F172A' }}>
                {user?.name || 'Naga'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                Owner & Executive
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorProfile}
            open={Boolean(anchorProfile)}
            onClose={() => setAnchorProfile(null)}
            PaperProps={{ sx: { borderRadius: '10px', minWidth: 160 } }}
          >
            <MenuItem onClick={() => setAnchorProfile(null)}>Profile & Preferences</MenuItem>
            <MenuItem onClick={() => setAnchorProfile(null)}>AI Voice Settings</MenuItem>
            <MenuItem onClick={() => setAnchorProfile(null)}>Quiet Hours</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
