import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import {
  AlertTriangle,
  PhoneCall,
  CheckSquare,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { CallDetailModal } from '../components/common/CallDetailModal';
import { api } from '../services/api';
import { Message, Call } from '../types/shared';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Message[]>([]);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getMessages({ importantOnly: true });
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleTriggerVoiceCall = async (msg: Message) => {
    try {
      const res = await api.triggerManualCall({
        messageId: msg.id,
        clientId: msg.clientId,
        customSummary: msg.analysis?.summary
      });
      if (res.call) {
        setSelectedCall(res.call);
        loadAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <AlertTriangle size={24} color="#DC2626" />
          <Typography variant="h1" sx={{ fontSize: '1.75rem' }}>
            Important Alerts & Priority Escalations
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Communications requiring Naga's immediate business decision or telephone intervention.
        </Typography>
      </Box>

      <Alert severity="warning" sx={{ mb: 3.5, borderRadius: '12px', border: '1px solid #FDE68A' }}>
        Saranya automatically places phone briefings to Naga's number (+916382379565) for all high-priority alerts with deadlines or financial terms.
      </Alert>

      <Grid container spacing={3}>
        {alerts.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 5, textAlign: 'center', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px' }}>
              <Typography variant="h4" sx={{ color: '#0F172A', mb: 1 }}>
                All clear! No pending high-priority alerts.
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Saranya is running in the background and will escalate whenever a client requires attention.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          alerts.map(item => (
            <Grid item xs={12} key={item.id}>
              <Card sx={{ borderLeft: '5px solid #DC2626', transition: 'all 0.15s ease', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.06)' } }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '10px',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <AlertTriangle size={22} />
                      </Box>
                      <Box>
                        <Typography variant="h4" sx={{ fontSize: '1.15rem' }}>
                          {item.clientName} ({item.company || 'Enterprise'})
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Received via {item.channel.toUpperCase()} • Category: {item.analysis?.category?.toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <PriorityBadge priority="high" />
                      <StatusBadge status={item.status} />
                      {item.analysis?.deadline && (
                        <Chip
                          icon={<Clock size={13} />}
                          label={`Deadline: ${item.analysis.deadline}`}
                          size="small"
                          sx={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 700, fontSize: '0.72rem' }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Chennai Tamil Briefing */}
                  <Box
                    sx={{
                      p: 2.5,
                      backgroundColor: '#EFF6FF',
                      borderRadius: '12px',
                      border: '1px solid #BFDBFE',
                      mb: 2.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Sparkles size={16} color="#2563EB" />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF', letterSpacing: '0.02em' }}>
                        SARANYA SPOKEN TAMIL BRIEFING
                      </Typography>
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: 'Noto Sans Tamil, sans-serif',
                        fontWeight: 600,
                        color: '#1E3A8A',
                        lineHeight: 1.6,
                        fontSize: '0.96rem'
                      }}
                    >
                      "{item.analysis?.summary}"
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#1D4ED8', fontWeight: 700, mt: 1.5 }}>
                      Required Action: {item.analysis?.next_step}
                    </Typography>
                  </Box>

                  {/* Reasoning */}
                  <Typography variant="body2" sx={{ color: '#475569', mb: 2.5 }}>
                    <strong>Why Saranya escalated:</strong> {item.analysis?.reason}
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      startIcon={<PhoneCall size={16} />}
                      onClick={() => handleTriggerVoiceCall(item)}
                    >
                      Call Naga Voice Briefing Now
                    </Button>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Idempotency verified • Duplicate prevention active
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Call Detail Modal */}
      <CallDetailModal
        call={selectedCall}
        open={Boolean(selectedCall)}
        onClose={() => setSelectedCall(null)}
      />
    </Box>
  );
};
