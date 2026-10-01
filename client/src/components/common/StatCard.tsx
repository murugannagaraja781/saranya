import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = '#EFF6FF',
  iconColor = '#2563EB',
  badge,
  badgeColor = '#DCFCE7',
  onClick
}) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
            }
          : {}
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>
            {title}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              backgroundColor: iconBgColor,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              fontSize: '1.85rem',
              color: '#0F172A'
            }}
          >
            {value}
          </Typography>

          {badge && (
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: '6px',
                backgroundColor: badgeColor,
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#15803D'
              }}
            >
              {badge}
            </Box>
          )}
        </Box>

        {subtitle && (
          <Typography variant="caption" sx={{ color: '#94A3B8', mt: 0.5, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
