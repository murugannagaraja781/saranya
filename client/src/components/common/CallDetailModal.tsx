import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Paper
} from '@mui/material';
import { PhoneCall, Clock, CheckCircle2, User, Bot } from 'lucide-react';
import { Call } from '../../types/shared';
import { PriorityBadge } from './PriorityBadge';
import { CallStatusBadge } from './CallStatusBadge';

interface CallDetailModalProps {
  call: Call | null;
  open: boolean;
  onClose: () => void;
}

export const CallDetailModal: React.FC<CallDetailModalProps> = ({ call, open, onClose }) => {
  if (!call) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ pb: 1, borderBottom: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PhoneCall size={20} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                Voice Briefing: {call.clientName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Recipient: {call.phoneNumber} • Provider: {call.provider} • ID: {call.id.slice(0, 12)}...
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <PriorityBadge priority={call.priority} />
            <CallStatusBadge status={call.status} />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Key Call Summary Metrics */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 2,
            mb: 3
          }}
        >
          <Paper elevation={0} sx={{ p: 2, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Call Duration
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}>
              {call.duration} seconds
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Channel Origin
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5, textTransform: 'capitalize' }}>
              {call.channel}
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Call Time
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A', mt: 0.5 }}>
              {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Paper>
        </Box>

        {/* Spoken Tamil Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
            Arya Spoken Tamil Summary (Briefing):
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: '#EFF6FF',
              borderRadius: '10px',
              border: '1px solid #BFDBFE'
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'Noto Sans Tamil, sans-serif',
                fontWeight: 500,
                color: '#1E3A8A',
                lineHeight: 1.6
              }}
            >
              "{call.summary}"
            </Typography>
          </Box>
        </Box>

        {/* Owner Instruction */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
            Naga's Voice Instruction Captured:
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: '#F0FDF4',
              borderRadius: '10px',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <CheckCircle2 size={20} color="#15803D" />
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#15803D' }}>
              "{call.ownerInstruction || 'No specific instruction captured.'}"
            </Typography>
          </Box>
        </Box>

        {/* Full Voice Conversation Dialogue Transcript */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
          Full Tamil Voice Transcript:
        </Typography>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            maxHeight: 280,
            overflowY: 'auto'
          }}
        >
          {call.transcript ? (
            call.transcript.split('\n\n').map((line, idx) => {
              const isArya = line.startsWith('Saranya:') || line.startsWith('Arya:');
              return (
                <Box
                  key={idx}
                  sx={{
                    mb: 1.5,
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start'
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: isArya ? '#2563EB' : '#1E293B',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.2
                    }}
                  >
                    {isArya ? <Bot size={16} /> : <User size={16} />}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: isArya ? '#2563EB' : '#0F172A' }}>
                      {isArya ? 'Arya (AI)' : 'Naga (Owner)'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#334155',
                        mt: 0.25,
                        fontFamily: isArya ? 'Noto Sans Tamil, sans-serif' : 'inherit'
                      }}
                    >
                      {line.replace(/^(Saranya:|Arya:|Naga:)\s*/, '')}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          ) : (
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              No transcript available.
            </Typography>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
