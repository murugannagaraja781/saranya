import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { MessageChannel } from '../../types/shared';

interface SimulateMessageDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TEMPLATES = [
  {
    name: 'Quotation Approved (Two Installments) - High Priority',
    clientName: 'Ramesh',
    company: 'ABC Traders',
    channel: 'whatsapp' as MessageChannel,
    contact: '+919840123456',
    subject: 'Quotation Approved',
    message: 'Hi Naga, quotation approved. We need two payment installments. Please confirm by tomorrow.'
  },
  {
    name: 'Project Delivery Confirmation - High Priority',
    clientName: 'Suresh Kumar',
    company: 'XYZ Company',
    channel: 'email' as MessageChannel,
    contact: 'suresh@xyzcorp.in',
    subject: 'Delivery Date Confirmation Required',
    message: 'Dear Naga,\nCould you please confirm the project delivery date for Phase 2? We need confirmation by tomorrow morning.'
  },
  {
    name: 'Critical System Issue - Blocker',
    clientName: 'Priya Sundaram',
    company: 'Chennai Logistics Hub',
    channel: 'whatsapp' as MessageChannel,
    contact: '+919840777666',
    subject: 'Urgent Issue with API Sync',
    message: 'Naga, warehouse API sync is failing. Shipments are stuck. Please investigate immediately.'
  },
  {
    name: 'Trivial Acknowledgment (Deterministic Pre-Filter test)',
    clientName: 'Karthik',
    company: 'Alpha Enterprises',
    channel: 'whatsapp' as MessageChannel,
    contact: '+919840555444',
    subject: '',
    message: 'Thanks Naga, got it!'
  }
];

export const SimulateMessageDialog: React.FC<SimulateMessageDialogProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<number>(0);
  const [channel, setChannel] = useState<MessageChannel>('whatsapp');
  const [clientName, setClientName] = useState('Ramesh');
  const [company, setCompany] = useState('ABC Traders');
  const [contact, setContact] = useState('+919840123456');
  const [subject, setSubject] = useState('Quotation Approved');
  const [message, setMessage] = useState(
    'Hi Naga, quotation approved. We need two payment installments. Please confirm by tomorrow.'
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApplyTemplate = (idx: number) => {
    setSelectedTemplate(idx);
    const t = TEMPLATES[idx];
    setClientName(t.clientName);
    setCompany(t.company);
    setChannel(t.channel);
    setContact(t.contact);
    setSubject(t.subject);
    setMessage(t.message);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.simulateInboundMessage({
        channel,
        clientName,
        company,
        clientContact: contact,
        subject,
        message
      });
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to simulate inbound message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '14px' } }}>
      <DialogTitle sx={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles size={20} color="#2563EB" />
          Simulate Inbound Client Message
        </Box>
        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
          Test the entire pipeline: Cleaning → Pre-filter → Gemini Reasoning → Voice Call → Task creation
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Template Selector */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#334155' }}>
            Quick Test Scenarios:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {TEMPLATES.map((t, idx) => (
              <Button
                key={t.name}
                size="small"
                variant={selectedTemplate === idx ? 'contained' : 'outlined'}
                onClick={() => handleApplyTemplate(idx)}
                sx={{ fontSize: '0.75rem', py: 0.5, px: 1.2 }}
              >
                {t.name.split(' - ')[0]}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Form fields */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <TextField
            label="Client Name"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Company"
            value={company}
            onChange={e => setCompany(e.target.value)}
            size="small"
            fullWidth
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Channel</InputLabel>
            <Select value={channel} label="Channel" onChange={e => setChannel(e.target.value as MessageChannel)}>
              <MenuItem value="whatsapp">WhatsApp Business</MenuItem>
              <MenuItem value="email">Gmail (Clients)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Client Contact"
            value={contact}
            onChange={e => setContact(e.target.value)}
            size="small"
            fullWidth
          />
        </Box>

        <TextField
          label="Subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        />

        <TextField
          label="Message Text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          multiline
          rows={3}
          fullWidth
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ p: 2, borderRadius: '10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckCircle2 size={18} color="#15803D" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#15803D' }}>
                Pipeline Successfully Executed!
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#1E293B', mb: 0.5 }}>
              <strong>Should Call Naga:</strong> {result.should_call ? 'YES (High Priority)' : 'NO'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#1E293B', mb: 0.5 }}>
              <strong>Arya Tamil Summary:</strong> "{result.analysis?.summary}"
            </Typography>
            <Typography variant="body2" sx={{ color: '#1E293B', mb: 0.5 }}>
              <strong>Next Step:</strong> {result.analysis?.next_step}
            </Typography>
            {result.callTriggered && (
              <Typography variant="caption" sx={{ color: '#047857', display: 'block', mt: 1, fontWeight: 600 }}>
                ✓ Voice Call to Naga simulated (+916382379565) & Owner Instruction Captured!
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !message.trim()}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
        >
          {loading ? 'Processing via Arya...' : 'Send to Pipeline'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
