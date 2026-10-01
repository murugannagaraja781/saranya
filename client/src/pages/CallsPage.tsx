import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Paper,
  IconButton
} from '@mui/material';
import { PhoneCall, Eye, Play, Sparkles } from 'lucide-react';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { CallStatusBadge } from '../components/common/CallStatusBadge';
import { CallDetailModal } from '../components/common/CallDetailModal';
import { api } from '../services/api';
import { Call } from '../types/shared';

export const CallsPage: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const data = await api.getCalls();
      setCalls(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1" sx={{ fontSize: '1.75rem', mb: 0.5 }}>
          Call History & Voice Briefings
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Record of all outbound calls placed by Saranya to Naga, along with recorded Tamil voice instructions.
        </Typography>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>DATE & TIME</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>CLIENT</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>REASON & BRIEFING</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>PRIORITY</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>DURATION</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem' }}>NAGA'S INSTRUCTION</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {calls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#64748B' }}>
                    No voice briefings placed yet.
                  </TableCell>
                </TableRow>
              ) : (
                calls.map(call => (
                  <TableRow key={call.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#64748B' }}>
                      {new Date(call.createdAt).toLocaleDateString()}<br />
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {call.clientName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        to {call.phoneNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'Noto Sans Tamil, sans-serif',
                          color: '#1E3A8A',
                          lineHeight: 1.4,
                          fontSize: '0.85rem'
                        }}
                      >
                        "{call.summary}"
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={call.priority} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {call.duration}s
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <CallStatusBadge status={call.status} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      {call.ownerInstruction ? (
                        <Box sx={{ p: 1, backgroundColor: '#F0FDF4', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#15803D', fontSize: '0.82rem' }}>
                            "{call.ownerInstruction}"
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          Pending
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Eye size={14} />}
                        onClick={() => setSelectedCall(call)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Transcript
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
