import React from 'react';
import { Chip } from '@mui/material';
import { CallStatus } from '../../types/shared';

export const CallStatusBadge: React.FC<{ status?: CallStatus | string; size?: 'small' | 'medium' }> = ({
  status = 'completed',
  size = 'small'
}) => {
  const s = status.toLowerCase();

  switch (s) {
    case 'completed':
    case 'answered':
      return (
        <Chip
          label="Answered & Briefed"
          size={size}
          sx={{
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            fontWeight: 700,
            fontSize: '0.72rem',
            border: '1px solid #BBF7D0'
          }}
        />
      );
    case 'calling':
      return (
        <Chip
          label="Calling Naga..."
          size={size}
          sx={{
            backgroundColor: '#DBEAFE',
            color: '#1D4ED8',
            fontWeight: 700,
            fontSize: '0.72rem',
            border: '1px solid #BFDBFE'
          }}
        />
      );
    case 'no_answer':
      return (
        <Chip
          label="No Answer"
          size={size}
          sx={{
            backgroundColor: '#FEF3C7',
            color: '#B45309',
            fontWeight: 600,
            fontSize: '0.72rem',
            border: '1px solid #FDE68A'
          }}
        />
      );
    case 'failed':
      return (
        <Chip
          label="Failed"
          size={size}
          sx={{
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            fontWeight: 700,
            fontSize: '0.72rem',
            border: '1px solid #FECACA'
          }}
        />
      );
    default:
      return (
        <Chip
          label={status}
          size={size}
          sx={{
            backgroundColor: '#F1F5F9',
            color: '#475569',
            fontSize: '0.72rem',
            border: '1px solid #E2E8F0'
          }}
        />
      );
  }
};
