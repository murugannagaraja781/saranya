import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB', // Sapphire / Royal Blue
      light: '#60A5FA',
      dark: '#1D4ED8',
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#0D9488', // Emerald Teal
      light: '#2DD4BF',
      dark: '#0F766E',
      contrastText: '#FFFFFF'
    },
    background: {
      default: '#F8FAFC', // Slate 50
      paper: '#FFFFFF'
    },
    text: {
      primary: '#0F172A', // Slate 900
      secondary: '#64748B' // Slate 500
    },
    divider: '#E2E8F0',
    success: {
      main: '#10B981',
      light: '#D1FAE5',
      dark: '#047857'
    },
    warning: {
      main: '#F59E0B',
      light: '#FEF3C7',
      dark: '#B45309'
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
      dark: '#B91C1C'
    },
    info: {
      main: '#3B82F6',
      light: '#DBEAFE',
      dark: '#1D4ED8'
    }
  },
  typography: {
    fontFamily: ['Inter', 'Noto Sans Tamil', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'].join(','),
    h1: {
      fontFamily: ['Outfit', 'Inter', 'sans-serif'].join(','),
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.02em',
      color: '#0F172A'
    },
    h2: {
      fontFamily: ['Outfit', 'Inter', 'sans-serif'].join(','),
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
      color: '#0F172A'
    },
    h3: {
      fontFamily: ['Outfit', 'Inter', 'sans-serif'].join(','),
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#0F172A'
    },
    h4: {
      fontFamily: ['Outfit', 'Inter', 'sans-serif'].join(','),
      fontWeight: 600,
      fontSize: '1.1rem',
      color: '#0F172A'
    },
    button: {
      textTransform: 'none',
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          padding: '8px 16px',
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
          }
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
          backgroundImage: 'none'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6
        }
      }
    }
  }
});
