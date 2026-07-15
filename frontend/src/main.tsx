import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { store } from './store';
import App from './App';
import './index.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8fa8f0',
      dark: '#4a5fd4',
      contrastText: '#fff',
    },
    secondary: {
      main: '#764ba2',
      light: '#9a6fc0',
      dark: '#5a3580',
      contrastText: '#fff',
    },
    success: { main: '#00c9a7', light: '#33d4b9', dark: '#00a388' },
    warning: { main: '#ffc107', light: '#ffcd38', dark: '#e0a800' },
    error: { main: '#ff6b6b', light: '#ff8e8e', dark: '#e05252' },
    info: { main: '#4facfe', light: '#73bbfe', dark: '#2b8fef' },
    background: {
      default: '#f0f2f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a3e',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: { borderRadius: 16 },
  shadows: [
    'none',
    '0 2px 8px rgba(0,0,0,0.04)',
    '0 4px 16px rgba(0,0,0,0.06)',
    '0 8px 24px rgba(0,0,0,0.08)',
    '0 12px 32px rgba(0,0,0,0.10)',
    '0 16px 40px rgba(0,0,0,0.12)',
    ...Array(20).fill('0 16px 40px rgba(0,0,0,0.12)'),
  ] as any,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 16px rgba(102,126,234,0.3)' },
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #5a6fd4 0%, #6a3f96 100%)' },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': { borderWidth: 2 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
        elevation1: { boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover fieldset': { borderColor: '#667eea' },
            '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            color: '#1a1a3e',
            background: 'linear-gradient(135deg, rgba(102,126,234,0.06) 0%, rgba(118,75,162,0.06) 100%)',
            borderBottom: '2px solid rgba(102,126,234,0.15)',
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { borderTop: '1px solid rgba(0,0,0,0.06)' },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
