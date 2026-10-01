import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Grid,
  Button,
  Chip,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search,
  Mail,
  MessageSquare,
  PhoneCall,
  CheckSquare,
  AlertTriangle,
  Sparkles,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { CallDetailModal } from '../components/common/CallDetailModal';
import { api } from '../services/api';
import { Message, Call } from '../types/shared';

export const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('Tomorrow');
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await api.getMessages();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    let list = [...messages];

    // Filter by Tab
    if (activeTab === 'important') {
      list = list.filter(m => m.analysis?.should_call || m.analysis?.priority === 'high');
    } else if (activeTab === 'high') {
      list = list.filter(m => m.analysis?.priority === 'high');
    } else if (activeTab === 'email') {
      list = list.filter(m => m.channel === 'email');
    } else if (activeTab === 'whatsapp') {
      list = list.filter(m => m.channel === 'whatsapp');
    } else if (activeTab === 'called') {
      list = list.filter(m => m.status === 'called');
    } else if (activeTab === 'pending') {
      list = list.filter(m => m.status === 'pending');
    } else if (activeTab === 'ignored') {
      list = list.filter(m => m.status === 'ignored');
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        m =>
          (m.clientName && m.clientName.toLowerCase().includes(q)) ||
          (m.company && m.company.toLowerCase().includes(q)) ||
          (m.subject && m.subject.toLowerCase().includes(q)) ||
          (m.message && m.message.toLowerCase().includes(q)) ||
          (m.analysis?.summary && m.analysis.summary.toLowerCase().includes(q))
      );
    }

    setFilteredMessages(list);
  }, [messages, activeTab, searchQuery]);

  const handleCallNow = async (msg: Message) => {
    try {
      const res = await api.triggerManualCall({
        messageId: msg.id,
        clientId: msg.clientId,
        customSummary: msg.analysis?.summary
      });
      if (res.call) {
        setSelectedCall(res.call);
        loadMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreateTask = (msg: Message) => {
    setSelectedMessage(msg);
    setTaskTitle(msg.analysis?.next_step || `Follow up with ${msg.clientName}`);
    setTaskDue(msg.analysis?.deadline || 'Tomorrow');
    setTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!selectedMessage) return;
    try {
      await api.createTask({
        title: taskTitle,
        description: `Source: Message ${selectedMessage.id}\nAI Summary: ${selectedMessage.analysis?.summary || ''}`,
        clientId: selectedMessage.clientId,
        clientName: selectedMessage.clientName,
        company: selectedMessage.company,
        messageId: selectedMessage.id,
        priority: selectedMessage.analysis?.priority || 'normal',
        dueDate: taskDue
      });
      setTaskDialogOpen(false);
      loadMessages();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1" sx={{ fontSize: '1.75rem', mb: 0.5 }}>
          Message Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Inspect client inquiries, cleaned emails, and Saranya's spoken Tamil AI briefings.
        </Typography>
      </Box>

      {/* Tabs and Filters */}
      <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', mb: 3, p: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2, alignItems: { md: 'center' } }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '0.85rem',
                minWidth: 'auto',
                px: 2
              }
            }}
          >
            <Tab label="All" value="all" />
            <Tab label="Important" value="important" />
            <Tab label="High Priority" value="high" />
            <Tab label="WhatsApp" value="whatsapp" />
            <Tab label="Email" value="email" />
            <Tab label="Called" value="called" />
            <Tab label="Pending" value="pending" />
            <Tab label="Ignored" value="ignored" />
          </Tabs>

          <Box sx={{ px: { xs: 1, md: 2 } }}>
            <TextField
              size="small"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={16} color="#94A3B8" />
                  </InputAdornment>
                )
              }}
              sx={{ width: { xs: '100%', md: 260 } }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Message Cards Grid */}
      <Grid container spacing={2.5}>
        {filteredMessages.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px' }}>
              <MessageSquare size={36} color="#94A3B8" style={{ marginBottom: 12 }} />
              <Typography variant="h4" sx={{ mb: 1, color: '#0F172A' }}>
                No messages found
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Try adjusting the active filter or search term.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredMessages.map(msg => (
            <Grid item xs={12} key={msg.id}>
              <Card sx={{ transition: 'all 0.15s ease', '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' } }}>
                <CardContent sx={{ p: 3 }}>
                  {/* Card Header */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '10px',
                          backgroundColor: msg.channel === 'whatsapp' ? '#DCFCE7' : '#EFF6FF',
                          color: msg.channel === 'whatsapp' ? '#15803D' : '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {msg.channel === 'whatsapp' ? <MessageSquare size={20} /> : <Mail size={20} />}
                      </Box>
                      <Box>
                        <Typography variant="h4" sx={{ fontSize: '1.05rem', color: '#0F172A' }}>
                          {msg.clientName || 'Client'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {msg.company || 'Enterprise'} • Received {new Date(msg.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(msg.receivedAt).toLocaleDateString()})
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <PriorityBadge priority={msg.analysis?.priority} />
                      <StatusBadge status={msg.status} />
                      {msg.analysis?.category && (
                        <Chip
                          label={msg.analysis.category.toUpperCase()}
                          size="small"
                          sx={{ fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#F1F5F9' }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Subject if email */}
                  {msg.subject && (
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 1 }}>
                      Subject: {msg.subject}
                    </Typography>
                  )}

                  {/* Spoken Tamil AI Summary Box */}
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#EFF6FF',
                      borderRadius: '10px',
                      border: '1px solid #BFDBFE',
                      mb: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Sparkles size={16} color="#2563EB" />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF', letterSpacing: '0.02em' }}>
                        SARANYA CHENNAI TAMIL BRIEFING
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Noto Sans Tamil, sans-serif',
                        fontWeight: 500,
                        color: '#1E3A8A',
                        lineHeight: 1.55,
                        fontSize: '0.92rem'
                      }}
                    >
                      "{msg.analysis?.summary || 'Analysis pending or filtered.'}"
                    </Typography>

                    {msg.analysis?.next_step && (
                      <Typography variant="caption" sx={{ color: '#1D4ED8', display: 'block', mt: 1, fontWeight: 700 }}>
                        Next Action: {msg.analysis.next_step} {msg.analysis.deadline && `(Deadline: ${msg.analysis.deadline})`}
                      </Typography>
                    )}
                  </Box>

                  {/* Original Cleaned Message Box */}
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Original Cleaned Text:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#475569',
                      p: 1.5,
                      backgroundColor: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      mb: 2.5,
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {msg.cleanMessage || msg.message}
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  {/* Actions Bar (Section 9) */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PhoneCall size={14} />}
                        onClick={() => handleCallNow(msg)}
                      >
                        Call Now
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CheckSquare size={14} />}
                        onClick={() => handleOpenCreateTask(msg)}
                      >
                        Create Task
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setSelectedMessage(msg)}
                        startIcon={<Eye size={14} />}
                        sx={{ color: '#64748B' }}
                      >
                        Full Details
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Create Task Dialog */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '14px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Create Action Task</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Task Title"
            fullWidth
            value={taskTitle}
            onChange={e => setTaskTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Due Date / Deadline"
            fullWidth
            value={taskDue}
            onChange={e => setTaskDue(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTaskDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTask}>
            Save Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Call Detail Modal */}
      <CallDetailModal
        call={selectedCall}
        open={Boolean(selectedCall)}
        onClose={() => setSelectedCall(null)}
      />
    </Box>
  );
};
