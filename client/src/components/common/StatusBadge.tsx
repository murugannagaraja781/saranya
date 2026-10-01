import React from 'react';
import { Chip } from '@mui/material';
import { MessageStatus } from '../../types/shared';

export const StatusBadge: React.FC<{ status?: MessageStatus | string; size?: 'small' | 'medium' }> = ({
  status = 'received',
  size = 'small'
}) => {
  const s = status.toLowerCase();

  switch (s) {
    case 'called':
      return (
        <Chip
          label="Called"
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
    case 'pending':
      return (
        <Chip
          label="Pending"
          size={size}
          sx={{
            backgroundColor: '#FEF3C7',
            color: '#B45309',
            fontWeight: 700,
            fontSize: '0.72rem',
            border: '1px solid #FDE68A'
          }}
        />
      );
    case 'analyzed':
      return (
        <Chip
          label="Analyzed"
          size={size}
          sx={{
            backgroundColor: '#E0E7FF',
            color: '#4338CA',
            fontWeight: 600,
            fontSize: '0.72rem',
            border: '1px solid #C7D2FE'
          }}
        />
      );
    case 'ignored':
      return (
        <Chip
          label="Ignored"
          size={size}
          sx={{
            backgroundColor: '#F1F5F9',
            color: '#64748B',
            fontWeight: 500,
            fontSize: '0.72rem',
            border: '1px solid #E2E8F0'
          }}
        />
      );
    default:
      return (
        <Chip
          label={status}
          size={size}
          sx={{
            backgroundColor: '#F8FAFC',
            color: '#475569',
            fontSize: '0.72rem',
            border: '1px solid #E2E8F0'
          }}
        />
      );
  }
};
