import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Grid,
  Button,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { CheckCircle2, Circle, Clock, CheckSquare, Sparkles, UserCheck } from 'lucide-react';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { api } from '../services/api';
import { Task, TaskStatus } from '../types/shared';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = tasks.filter(t => {
    if (activeTab === 'all') return true;
    return t.status === activeTab;
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1" sx={{ fontSize: '1.75rem', mb: 0.5 }}>
          Action Tasks & Follow-ups
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Action items automatically extracted by Saranya from client messages and Naga's phone call voice instructions.
        </Typography>
      </Box>

      {/* Filter Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        sx={{ mb: 3, borderBottom: '1px solid #E2E8F0' }}
      >
        <Tab label={`All (${tasks.length})`} value="all" />
        <Tab label={`Pending (${tasks.filter(t => t.status === 'pending').length})`} value="pending" />
        <Tab label={`In Progress (${tasks.filter(t => t.status === 'in_progress').length})`} value="in_progress" />
        <Tab label={`Completed (${tasks.filter(t => t.status === 'completed').length})`} value="completed" />
      </Tabs>

      <Grid container spacing={2.5}>
        {filtered.map(task => {
          const isDone = task.status === 'completed';
          return (
            <Grid item xs={12} key={task.id}>
              <Card
                sx={{
                  transition: 'all 0.15s ease',
                  opacity: isDone ? 0.75 : 1,
                  backgroundColor: isDone ? '#F8FAFC' : '#FFFFFF'
                }}
              >
                <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <IconButton
                    onClick={() => handleToggleStatus(task)}
                    sx={{ color: isDone ? '#10B981' : '#CBD5E1', mt: -0.5 }}
                  >
                    {isDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </IconButton>

                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontSize: '1.05rem',
                          textDecoration: isDone ? 'line-through' : 'none',
                          color: isDone ? '#64748B' : '#0F172A'
                        }}
                      >
                        {task.title}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <PriorityBadge priority={task.priority} />
                        <Chip
                          icon={task.source === 'owner_instruction' ? <UserCheck size={12} /> : <Sparkles size={12} />}
                          label={task.source === 'owner_instruction' ? "Naga's Voice Instruction" : "AI Detected Action"}
                          size="small"
                          sx={{
                            backgroundColor: task.source === 'owner_instruction' ? '#ECFDF5' : '#EFF6FF',
                            color: task.source === 'owner_instruction' ? '#047857' : '#1E40AF',
                            fontWeight: 600,
                            fontSize: '0.72rem'
                          }}
                        />
                      </Box>
                    </Box>

                    {task.description && (
                      <Typography variant="body2" sx={{ color: '#475569', mb: 1.5, whiteSpace: 'pre-line' }}>
                        {task.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#64748B', fontSize: '0.8rem' }}>
                      {task.clientName && (
                        <span>Client: <strong>{task.clientName}</strong></span>
                      )}
                      {task.dueDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Clock size={14} />
                          <span>Due: <strong>{task.dueDate}</strong></span>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
