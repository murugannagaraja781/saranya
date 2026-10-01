import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  Alert,
  Paper
} from '@mui/material';
import { Save, User, Moon, Shield, Sliders } from 'lucide-react';
import { api } from '../services/api';
import { Settings } from '../types/shared';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [ownerName, setOwnerName] = useState('Naga');
  const [ownerPhone, setOwnerPhone] = useState('+916382379565');
  const [ownerEmail, setOwnerEmail] = useState('naga@example.com');

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [allowHighPriority, setAllowHighPriority] = useState(true);

  const [processOnlyLabel, setProcessOnlyLabel] = useState('Clients');
  const [ignoreSpam, setIgnoreSpam] = useState(true);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(data => {
      setSettings(data);
      setOwnerName(data.ownerName);
      setOwnerPhone(data.ownerPhone);
      setOwnerEmail(data.ownerEmail || 'naga@example.com');
      setQuietHoursEnabled(data.quietHours?.enabled ?? true);
      setQuietStart(data.quietHours?.start || '22:00');
      setQuietEnd(data.quietHours?.end || '07:00');
      setAllowHighPriority(data.quietHours?.allowHighPriority ?? true);
      setProcessOnlyLabel(data.emailFilters?.processOnlyLabel || 'Clients');
      setIgnoreSpam(data.emailFilters?.ignoreSpamAndMarketing ?? true);
    });
  }, []);

  const handleSave = async () => {
    try {
      await api.updateSettings({
        ownerName,
        ownerPhone,
        ownerEmail,
        quietHours: {
          enabled: quietHoursEnabled,
          start: quietStart,
          end: quietEnd,
          allowHighPriority
        },
        emailFilters: {
          processOnlyLabel,
          ignoreSpamAndMarketing: ignoreSpam
        }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1" sx={{ fontSize: '1.75rem', mb: 0.5 }}>
          System & Account Settings
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Manage Naga's personal profile, quiet hours, email filtering, and telephony dispatch rules.
        </Typography>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '10px' }}>
          Settings successfully updated.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <User size={20} color="#2563EB" />
                <Typography variant="h3" sx={{ fontSize: '1.15rem' }}>
                  Owner Profile
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Owner Name"
                  fullWidth
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                />
                <TextField
                  label="Owner Mobile Phone (E.164)"
                  fullWidth
                  value={ownerPhone}
                  onChange={e => setOwnerPhone(e.target.value)}
                  helperText="Saranya places urgent voice calls to this number"
                />
                <TextField
                  label="Primary Email"
                  fullWidth
                  value={ownerEmail}
                  onChange={e => setOwnerEmail(e.target.value)}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quiet Hours Card (Section 48) */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Moon size={20} color="#7C3AED" />
                <Typography variant="h3" sx={{ fontSize: '1.15rem' }}>
                  Quiet Hours (Sleep & Rest)
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                During quiet hours, routine calls are silenced and queued. Urgent financial updates and blockers can still ring if enabled.
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={quietHoursEnabled}
                    onChange={e => setQuietHoursEnabled(e.target.checked)}
                    color="primary"
                  />
                }
                label="Enable Quiet Hours Schedule"
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    label="Start Time"
                    type="time"
                    fullWidth
                    value={quietStart}
                    onChange={e => setQuietStart(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={!quietHoursEnabled}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="End Time"
                    type="time"
                    fullWidth
                    value={quietEnd}
                    onChange={e => setQuietEnd(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={!quietHoursEnabled}
                  />
                </Grid>
              </Grid>

              <FormControlLabel
                control={
                  <Switch
                    checked={allowHighPriority}
                    onChange={e => setAllowHighPriority(e.target.checked)}
                    color="primary"
                    disabled={!quietHoursEnabled}
                  />
                }
                label="Allow High-Priority Calls During Quiet Hours"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Filtering & Privacy Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Shield size={20} color="#0D9488" />
                <Typography variant="h3" sx={{ fontSize: '1.15rem' }}>
                  Email & Ingestion Guardrails
                </Typography>
              </Box>

              <TextField
                label="Filter Gmail by Label"
                fullWidth
                value={processOnlyLabel}
                onChange={e => setProcessOnlyLabel(e.target.value)}
                helperText="Only incoming emails with this label are processed (default: Clients)"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={ignoreSpam}
                    onChange={e => setIgnoreSpam(e.target.checked)}
                    color="primary"
                  />
                }
                label="Deterministic Pre-Filter (Auto-skip OTPs, spam, and marketing)"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Development & Mock Mode Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Sliders size={20} color="#EA580C" />
                <Typography variant="h3" sx={{ fontSize: '1.15rem' }}>
                  Mock & Demo Mode
                </Typography>
              </Box>

              <Paper elevation={0} sx={{ p: 2, backgroundColor: '#FEF3C7', borderRadius: '10px', border: '1px solid #FDE68A', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#B45309' }}>
                  MOCK_MODE=true Active
                </Typography>
                <Typography variant="caption" sx={{ color: '#92400E', display: 'block', mt: 0.5 }}>
                  Deterministic AI analysis and Tamil voice dialogue simulations are enabled. No paid cloud services are billed during local testing.
                </Typography>
              </Paper>

              <Typography variant="caption" sx={{ color: '#64748B' }}>
                To switch to live services, supply valid credentials in <code>.env</code> and set <code>MOCK_MODE=false</code>.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3.5, pb: 4 }}>
        <Button variant="contained" size="large" startIcon={<Save size={18} />} onClick={handleSave}>
          Save All Settings
        </Button>
      </Box>
    </Box>
  );
};
