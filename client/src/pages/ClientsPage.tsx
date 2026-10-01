import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search,
  Users,
  Phone,
  Mail,
  MessageSquare,
  PhoneCall,
  CheckSquare,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { api } from '../services/api';
import { Client } from '../types/shared';

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filtered = clients.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.75rem', mb: 0.5 }}>
            Client Management
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748B' }}>
            Monitor client accounts, conversation frequency, and voice briefing interactions.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color="#94A3B8" />
                </InputAdornment>
              )
            }}
            sx={{ width: 220 }}
          />
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        {filtered.map(client => (
          <Grid item xs={12} md={6} lg={4} key={client.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: '#2563EB',
                  boxShadow: '0 6px 20px rgba(37, 99, 235, 0.08)'
                }
              }}
            >
              <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        fontWeight: 700,
                        fontSize: '1.1rem'
                      }}
                    >
                      {client.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontSize: '1.05rem', color: '#0F172A' }}>
                        {client.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                        {client.company}
                      </Typography>
                    </Box>
                  </Box>

                  <PriorityBadge priority={client.priority} />
                </Box>

                {/* Contact details */}
                <Box sx={{ mb: 2.5, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  {client.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569', fontSize: '0.82rem' }}>
                      <Phone size={14} color="#64748B" />
                      <span>{client.phone}</span>
                    </Box>
                  )}
                  {client.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#475569', fontSize: '0.82rem' }}>
                      <Mail size={14} color="#64748B" />
                      <span>{client.email}</span>
                    </Box>
                  )}
                </Box>

                {/* Interaction Counts */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1,
                    p: 1.5,
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    textAlign: 'center',
                    mb: 2.5
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                      MESSAGES
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      {client.totalMessages}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                      AI CALLS
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#15803D' }}>
                      {client.totalCalls}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                      OPEN TASKS
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
                      {client.openTasks || 0}
                    </Typography>
                  </Box>
                </Box>

                {client.notes && (
                  <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic', mb: 2, display: 'block' }}>
                    "{client.notes}"
                  </Typography>
                )}

                <Box sx={{ mt: 'auto', pt: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    endIcon={<ArrowRight size={15} />}
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    View Timeline & Calls
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
