import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Divider,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  PhoneCall,
  CheckSquare,
  Sparkles,
  Calendar
} from 'lucide-react';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { CallStatusBadge } from '../components/common/CallStatusBadge';
import { CallDetailModal } from '../components/common/CallDetailModal';
import { api } from '../services/api';
import { Client, Message, Call, Task } from '../types/shared';

export const ClientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<(Client & { messages: Message[]; calls: Call[]; tasks: Task[] }) | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getClientById(id)
      .then(res => setClient(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1">Loading client history...</Typography>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ p: 4 }}>
        <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate('/clients')}>
          Back to Clients
        </Button>
        <Typography variant="h4" sx={{ mt: 2 }}>Client not found.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowLeft size={16} />}
        onClick={() => navigate('/clients')}
        sx={{ mb: 2, color: '#64748B' }}
      >
        Back to Clients
      </Button>

      {/* Header Profile Card */}
      <Card sx={{ mb: 3.5 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box>
              <Typography variant="h2" sx={{ fontSize: '1.6rem', color: '#0F172A' }}>
                {client.name}
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 500, mt: 0.25 }}>
                {client.company}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <PriorityBadge priority={client.priority} />
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>PHONE / WHATSAPP</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mt: 0.5 }}>
                {client.phone || client.whatsapp || 'Not provided'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>EMAIL ADDRESS</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mt: 0.5 }}>
                {client.email || 'Not provided'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>LAST INTERACTION</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mt: 0.5 }}>
                {client.lastInteraction || new Date(client.lastMessageAt).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
          <Tab label={`Messages (${client.messages?.length || 0})`} />
          <Tab label={`Voice Briefing Calls (${client.calls?.length || 0})`} />
          <Tab label={`Action Tasks (${client.tasks?.length || 0})`} />
        </Tabs>
      </Box>

      {/* Messages Tab */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {client.messages?.map(m => (
            <Card key={m.id}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    {m.channel.toUpperCase()} • {new Date(m.receivedAt).toLocaleString()}
                  </Typography>
                  <StatusBadge status={m.status} />
                </Box>
                {m.analysis?.summary && (
                  <Box sx={{ p: 1.5, backgroundColor: '#EFF6FF', borderRadius: '8px', mb: 1.5, border: '1px solid #BFDBFE' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'Noto Sans Tamil, sans-serif', color: '#1E3A8A' }}>
                      "{m.analysis.summary}"
                    </Typography>
                  </Box>
                )}
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  {m.cleanMessage || m.message}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Calls Tab */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {client.calls?.map(c => (
            <Card key={c.id}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneCall size={18} color="#15803D" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Call to Naga ({c.duration}s)
                    </Typography>
                  </Box>
                  <CallStatusBadge status={c.status} />
                </Box>

                <Typography variant="body2" sx={{ fontFamily: 'Noto Sans Tamil, sans-serif', color: '#1E3A8A', mb: 1.5 }}>
                  Briefing: "{c.summary}"
                </Typography>

                {c.ownerInstruction && (
                  <Box sx={{ p: 1.5, backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#15803D', display: 'block' }}>
                      NAGA'S RECORDED INSTRUCTION:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#15803D' }}>
                      "{c.ownerInstruction}"
                    </Typography>
                  </Box>
                )}

                <Button size="small" variant="outlined" onClick={() => setSelectedCall(c)}>
                  View Full Transcript
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Tasks Tab */}
      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {client.tasks?.map(t => (
            <Card key={t.id}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t.title}
                  </Typography>
                  <PriorityBadge priority={t.priority} />
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', mb: 1.5 }}>
                  {t.description}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Due: {t.dueDate || 'Tomorrow'} • Status: {t.status}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Call Detail Modal */}
      <CallDetailModal
        call={selectedCall}
        open={Boolean(selectedCall)}
        onClose={() => setSelectedCall(null)}
      />
    </Box>
  );
};
