import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import { Sparkles, Bot, Save, CheckCircle2, MessageSquare, Volume2 } from 'lucide-react';
import { api } from '../services/api';
import { Settings } from '../types/shared';

export const InstructionsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [assistantName, setAssistantName] = useState('Saranya');
  const [ownerName, setOwnerName] = useState('Naga');
  const [language, setLanguage] = useState('Tamil');
  const [voiceStyle, setVoiceStyle] = useState('Natural Chennai conversational Tamil');
  const [callThreshold, setCallThreshold] = useState('high_and_normal');
  const [newVocab, setNewVocab] = useState('');
  const [vocabList, setVocabList] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(data => {
      setSettings(data);
      setAssistantName(data.assistantName);
      setOwnerName(data.ownerName);
      setLanguage(data.language);
      setVoiceStyle(data.voiceStyle);
      setCallThreshold(data.callThreshold);
      setVocabList(data.businessVocabulary || []);
    });
  }, []);

  const handleAddVocab = () => {
    if (newVocab.trim() && !vocabList.includes(newVocab.trim())) {
      setVocabList(prev => [...prev, newVocab.trim()]);
      setNewVocab('');
    }
  };

  const handleRemoveVocab = (tag: string) => {
    setVocabList(prev => prev.filter(t => t !== tag));
  };

  const handleSave = async () => {
    try {
      await api.updateSettings({
        assistantName,
        ownerName,
        language,
        voiceStyle,
        callThreshold: callThreshold as any,
        businessVocabulary: vocabList
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
          AI Persona & Instructions Configuration
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Tune Saranya's persona, spoken Tamil phrasing rules, business vocabulary preservation, and phone escalation criteria.
        </Typography>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '10px' }}>
          Settings and AI persona instructions successfully updated.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Form Controls */}
        <Grid item xs={12} md={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '1.2rem', mb: 2.5 }}>
                Persona Identity & Voice Behavior
              </Typography>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Assistant Name"
                    fullWidth
                    value={assistantName}
                    onChange={e => setAssistantName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Owner Name"
                    fullWidth
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Primary Language"
                    fullWidth
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Voice Style / Dialect"
                    fullWidth
                    value={voiceStyle}
                    onChange={e => setVoiceStyle(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Call Escalation Sensitivity</InputLabel>
                    <Select
                      value={callThreshold}
                      label="Call Escalation Sensitivity"
                      onChange={e => setCallThreshold(e.target.value)}
                    >
                      <MenuItem value="high_only">High Priority Only (Payments & Urgent Blockers)</MenuItem>
                      <MenuItem value="high_and_normal">High & Normal Actionable Messages (Recommended)</MenuItem>
                      <MenuItem value="all">All Inquiries</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Protected Business Terms (Preserved in English)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                These keywords are never artificially translated into literary Tamil to maintain natural business flow.
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {vocabList.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveVocab(tag)}
                    size="small"
                    sx={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600 }}
                  />
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  placeholder="Add custom keyword (e.g. consignment)"
                  size="small"
                  value={newVocab}
                  onChange={e => setNewVocab(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddVocab()}
                  sx={{ width: 280 }}
                />
                <Button variant="outlined" size="small" onClick={handleAddVocab}>
                  Add Keyword
                </Button>
              </Box>

              <Box sx={{ mt: 3.5 }}>
                <Button variant="contained" startIcon={<Save size={16} />} onClick={handleSave}>
                  Save AI Persona Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Live Tamil Voice Dialogue Preview */}
        <Grid item xs={12} md={5}>
          <Card sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Volume2 size={20} />
                </Box>
                <Typography variant="h3" sx={{ fontSize: '1.15rem' }}>
                  Live Dialogue Pattern
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                Chennai-style natural conversational Tamil rule conforming to Section 18 & 19:
              </Typography>

              <Paper elevation={0} sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563EB', display: 'block', mb: 0.5 }}>
                  STEP 1: GREETING & CHANNEL IDENTIFICATION
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'Noto Sans Tamil, sans-serif', color: '#1E293B', mb: 1.5 }}>
                  "வணக்கம் Naga! நான் Saranya. உங்க client Ramesh கிட்ட இருந்து WhatsApp-ல ஒரு முக்கியமான reply வந்திருக்கு."
                </Typography>

                <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563EB', display: 'block', mb: 0.5 }}>
                  STEP 2: CONCLUSION & NEXT STEP (Tamil Script)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'Noto Sans Tamil, sans-serif', color: '#1E293B', mb: 1.5 }}>
                  "ABC Traders quotation-அ OK பண்ணிட்டாங்க, ஆனா payment-அ இரண்டு installment-ஆ கேக்குறாங்க. நாளைக்குள்ள நீங்க confirm பண்ணணும்."
                </Typography>

                <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563EB', display: 'block', mb: 0.5 }}>
                  STEP 3: ASKS WHAT TO NOTE
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'Noto Sans Tamil, sans-serif', color: '#1E293B', mb: 1.5 }}>
                  "இதுக்கு நான் என்ன note பண்ணணும்?"
                </Typography>

                <Typography variant="caption" sx={{ fontWeight: 700, color: '#15803D', display: 'block', mb: 0.5 }}>
                  STEP 4: NAGA RESPONDS
                </Typography>
                <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 600, mb: 1.5 }}>
                  Naga: "Two installment okay என்று note பண்ணு."
                </Typography>

                <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563EB', display: 'block', mb: 0.5 }}>
                  STEP 5: CONFIRMATION & TERMINATION
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'Noto Sans Tamil, sans-serif', color: '#1E293B' }}>
                  "சரி Naga. Two installment okay-ன்னு note பண்ணிட்டேன். Bye."
                </Typography>
              </Paper>

              <Box sx={{ p: 2, backgroundColor: '#FAF5FF', borderRadius: '10px', border: '1px solid #F3E8FF' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#7E22CE', display: 'block', mb: 0.5 }}>
                  CONVERSATION RULES ENFORCED
                </Typography>
                <Typography variant="caption" sx={{ color: '#6B21A8', display: 'block', lineHeight: 1.5 }}>
                  • Under 25 words per turn<br />
                  • Numbers, dates, money spoken slowly<br />
                  • No email addresses, URLs, or signatures read aloud<br />
                  • Pure Tamil script (never Tanglish)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
