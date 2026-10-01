import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Database,
  Mail,
  MessageSquare,
  PhoneCall
} from 'lucide-react';
import { api } from '../services/api';
import { IntegrationStatus } from '../types/shared';

export const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const data = await api.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const getStatusBadge = (status: IntegrationStatus['status']) => {
    if (status === 'connected') {
      return (
        <Chip
          icon={<CheckCircle2 size={13} />}
          label="CONNECTED"
          size="small"
          sx={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.72rem' }}
        />
      );
    }
    if (status === 'mock_mode') {
      return (
        <Chip
          icon={<Sparkles size={13} />}
          label="DEMO / MOCK MODE"
          size="small"
          sx={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 700, fontSize: '0.72rem' }}
        />
      );
    }
    return (
      <Chip
        icon={<AlertCircle size={13} />}
        label="NOT CONFIGURED"
        size="small"
        sx={{ backgroundColor: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: '0.72rem' }}
      />
    );
  };

  const getIntegrationIcon = (key: string) => {
    switch (key) {
      case 'gemini':
        return <Sparkles size={22} color="#2563EB" />;
      case 'firebase':
        return <Database size={22} color="#D97706" />;
      case 'n8n':
        return <Cpu size={22} color="#EA580C" />;
      case 'gmail':
        return <Mail size={22} color="#DC2626" />;
      case 'whatsapp':
        return <MessageSquare size={22} color="#16A34A" />;
      case 'snapserve':
        return <PhoneCall size={22} color="#7C3AED" />;
      case 'vobiz':
        return <PhoneCall size={22} color="#0D9488" />;
      default:
        return <Cpu size={22} />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.75rem', mb: 0.5 }}>
            System Integrations & Service Adapters
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748B' }}>
            Live status of external telephony, AI reasoning, database, and automation webhook providers.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshCw size={15} />}
          onClick={loadIntegrations}
        >
          Check Health
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3.5, borderRadius: '12px' }}>
        <strong>Development & Integrity Guarantee:</strong> In accordance with project rules, services without active credentials display <em>"Mock Mode"</em> or <em>"Not Configured"</em>. The system runs deterministically offline without claiming false connections.
      </Alert>

      <Grid container spacing={2.5}>
        {integrations.map(item => (
          <Grid item xs={12} md={6} key={item.id}>
            <Card sx={{ height: '100%', transition: 'all 0.15s ease', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.06)' } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '10px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {getIntegrationIcon(item.key)}
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ fontSize: '1.1rem', color: '#0F172A' }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Checked: {new Date(item.lastCheckedAt).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>

                  {getStatusBadge(item.status)}
                </Box>

                <Paper elevation={0} sx={{ p: 1.75, backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block' }}>
                    CONFIGURATION & ADAPTER DETAILS
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1E293B', mt: 0.25, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {item.details}
                  </Typography>
                </Paper>

                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  {item.key === 'gemini' && 'Google Generative AI SDK (gemini-1.5-flash) with structured schema & Chennai Tamil script generation.'}
                  {item.key === 'firebase' && 'Firebase Admin SDK / Firestore NoSQL document store with memory-based fallback.'}
                  {item.key === 'n8n' && 'Automation engine trigger endpoint receiving webhook payloads with signature validation.'}
                  {item.key === 'gmail' && 'Monitors "Clients" label, cleans quoted reply chains and strips signatures before AI inspection.'}
                  {item.key === 'whatsapp' && 'Meta Cloud API webhook with verification challenge and payload normalization.'}
                  {item.key === 'snapserve' && 'Voice agent provider interface with caller variable injection (Naga, summary, next_step).'}
                  {item.key === 'vobiz' && 'Telephony provider interface placing outbound E.164 phone calls to Naga.'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
