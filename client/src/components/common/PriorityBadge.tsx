import React from 'react';
import { Chip } from '@mui/material';
import { MessagePriority } from '../../types/shared';

export const PriorityBadge: React.FC<{ priority?: MessagePriority | string; size?: 'small' | 'medium' }> = ({
  priority = 'normal',
  size = 'small'
}) => {
  const p = priority.toLowerCase();
  if (p === 'high') {
    return (
      <Chip
        label="HIGH"
        size={size}
        sx={{
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.02em',
          border: '1px solid #FECACA'
        }}
      />
    );
  }
  if (p === 'low') {
    return (
      <Chip
        label="LOW"
        size={size}
        sx={{
          backgroundColor: '#F1F5F9',
          color: '#64748B',
          fontWeight: 600,
          fontSize: '0.72rem',
          border: '1px solid #E2E8F0'
        }}
      />
    );
  }
  return (
    <Chip
      label="NORMAL"
      size={size}
      sx={{
        backgroundColor: '#EFF6FF',
        color: '#2563EB',
        fontWeight: 600,
        fontSize: '0.72rem',
        border: '1px solid #DBEAFE'
      }}
    />
  );
};
