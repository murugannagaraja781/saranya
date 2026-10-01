import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  MessageSquare,
  AlertTriangle,
  PhoneCall,
  CheckSquare,
  Users,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Mail,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { StatCard } from '../components/common/StatCard';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { CallDetailModal } from '../components/common/CallDetailModal';
import { api } from '../services/api';
import { DashboardStats, Message, Call } from '../types/shared';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { onOpenSimulate } = useOutletContext<{ onOpenSimulate: () => void }>();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, messagesData] = await Promise.all([
        api.getDashboardStats(),
        api.getMessages()
      ]);
      setStats(statsData);
      setMessages(messagesData.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleCallClient = async (msg: Message) => {
    try {
      const res = await api.triggerManualCall({
        messageId: msg.id,
        clientId: msg.clientId,
        customSummary: msg.analysis?.summary
      });
      if (res.call) {
        setSelectedCall(res.call);
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      {/* Top Banner & Greetings */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, mb: 0.5 }}>
            {getGreeting()}, Naga
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748B' }}>
            Saranya is actively monitoring your client communication across Gmail & WhatsApp.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshCw size={15} />}
            onClick={fetchDashboardData}
            sx={{ borderColor: '#CBD5E1', color: '#475569' }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<Sparkles size={16} />}
            onClick={onOpenSimulate}
          >
            Simulate Client Message
          </Button>
        </Box>
      </Box>

      {/* Real-time System Status Card */}
      <Card sx={{ mb: 3.5, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '20px',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0'
                }}
              >
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)'
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#065F46' }}>
                  SARANYA STATUS: {stats?.systemStatus.saranyaStatus || 'ONLINE'}
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#475569', display: { xs: 'none', md: 'block' } }}>
                Monitoring Channels:
              </Typography>
              <Chip
                label="Gmail (Clients)"
                size="small"
                sx={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: '0.72rem' }}
              />
              <Chip
                label="WhatsApp Business"
                size="small"
                sx={{ backgroundColor: '#F0FDF4', color: '#15803D', fontWeight: 600, fontSize: '0.72rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Voice Engine:
              </Typography>
              <Chip
                label={stats?.systemStatus.voice || 'Mock Mode'}
                size="small"
                sx={{
                  backgroundColor: '#F1F5F9',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '0.72rem'
                }}
              />
              <Chip
                label="Chennai Tamil Voice Briefing"
                size="small"
                sx={{
                  backgroundColor: '#FAF5FF',
                  color: '#7E22CE',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  border: '1px solid #F3E8FF'
                }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 6 Key Statistics Cards (Section 8) */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Messages Today"
            value={stats?.messagesToday ?? 24}
            subtitle="Analyzed by AI"
            icon={<MessageSquare size={20} />}
            iconBgColor="#EFF6FF"
            iconColor="#2563EB"
            onClick={() => navigate('/messages')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Important"
            value={stats?.importantMessages ?? 7}
            subtitle="Require attention"
            icon={<AlertTriangle size={20} />}
            iconBgColor="#FEF3C7"
            iconColor="#D97706"
            onClick={() => navigate('/alerts')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Calls Made"
            value={stats?.callsMade ?? 3}
            subtitle="Voice briefings"
            icon={<PhoneCall size={20} />}
            iconBgColor="#DCFCE7"
            iconColor="#15803D"
            onClick={() => navigate('/calls')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Pending Actions"
            value={stats?.pendingActions ?? 5}
            subtitle="Tasks in progress"
            icon={<CheckSquare size={20} />}
            iconBgColor="#F3E8FF"
            iconColor="#9333EA"
            onClick={() => navigate('/tasks')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="High Priority"
            value={stats?.highPriority ?? 2}
            subtitle="Financial / blockers"
            badge="URGENT"
            badgeColor="#FEE2E2"
            icon={<AlertTriangle size={20} />}
            iconBgColor="#FEE2E2"
            iconColor="#DC2626"
            onClick={() => navigate('/alerts')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Active Clients"
            value={stats?.activeClients ?? 3}
            subtitle="In communication"
            icon={<Users size={20} />}
            iconBgColor="#F1F5F9"
            iconColor="#475569"
            onClick={() => navigate('/clients')}
          />
        </Grid>
      </Grid>

      {/* Recent Activity Table (Section 8) */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: '1.15rem' }}>
              Recent Client Activity
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Latest incoming messages and Saranya's spoken Tamil analysis
            </Typography>
          </Box>
          <Button
            size="small"
            endIcon={<ArrowRight size={16} />}
            onClick={() => navigate('/messages')}
          >
            View All Messages
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>TIME</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>CLIENT</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>CHANNEL</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>SARANYA TAMIL SUMMARY</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>PRIORITY</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton height={40} />
                    </TableCell>
                  </TableRow>
                ))
              ) : messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#64748B' }}>
                    No messages recorded yet. Click "Simulate Client Message" to test.
                  </TableCell>
                </TableRow>
              ) : (
                messages.map(msg => (
                  <TableRow key={msg.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {new Date(msg.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {msg.clientName || 'Valued Client'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {msg.company || 'Enterprise'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={msg.channel === 'whatsapp' ? <MessageSquare size={13} /> : <Mail size={13} />}
                        label={msg.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}
                        size="small"
                        sx={{
                          backgroundColor: msg.channel === 'whatsapp' ? '#DCFCE7' : '#EFF6FF',
                          color: msg.channel === 'whatsapp' ? '#166534' : '#1E40AF',
                          fontWeight: 600,
                          fontSize: '0.72rem'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 360 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'Noto Sans Tamil, sans-serif',
                          color: '#1E293B',
                          fontSize: '0.86rem',
                          lineHeight: 1.4
                        }}
                      >
                        {msg.analysis?.summary || msg.cleanMessage || msg.message}
                      </Typography>
                      {msg.analysis?.next_step && (
                        <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 600, display: 'block', mt: 0.5 }}>
                          Next Step: {msg.analysis.next_step}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={msg.analysis?.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={msg.status} />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PhoneCall size={14} />}
                        onClick={() => handleCallClient(msg)}
                        sx={{ fontSize: '0.75rem', mr: 1 }}
                      >
                        Call Now
                      </Button>
                      <Button
                        size="small"
                        onClick={() => navigate('/messages')}
                        sx={{ fontSize: '0.75rem', color: '#64748B' }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Call Detail Modal */}
      <CallDetailModal
        call={selectedCall}
        open={Boolean(selectedCall)}
        onClose={() => setSelectedCall(null)}
      />
    </Box>
  );
};
