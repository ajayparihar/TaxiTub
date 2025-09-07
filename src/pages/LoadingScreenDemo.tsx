// TaxiTub Module: Loading Screen Demo Page
// Version: v1.0.0
// Last Updated: 2025-09-07
// Author: AI Agent
// Changelog: Demo page to showcase the new premium loading screen components

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { useThemeMode } from '../components/ThemeModeProvider';
import {
  PageLoadingScreen,
  OverlayLoadingScreen,
  ComponentLoadingScreen,
} from '../components/PremiumLoadingScreen';

const LoadingScreenDemo: React.FC = () => {
  const { mode, toggleMode } = useThemeMode();
  const [showPageLoading, setShowPageLoading] = useState(false);
  const [showOverlayLoading, setShowOverlayLoading] = useState(false);

  const handleShowPageLoading = () => {
    setShowPageLoading(true);
    setTimeout(() => setShowPageLoading(false), 3000);
  };

  const handleShowOverlayLoading = () => {
    setShowOverlayLoading(true);
    setTimeout(() => setShowOverlayLoading(false), 2000);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          🎨 Loading Screen Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Test the new premium loading screens with different themes and variants
        </Typography>
        
        {/* Theme Toggle */}
        <FormControlLabel
          control={<Switch checked={mode === 'dark'} onChange={toggleMode} />}
          label={`${mode === 'light' ? '☀️ Light' : '🌙 Dark'} Theme`}
        />
      </Box>

      <Grid container spacing={4}>
        {/* Component Variants */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Component Loading (Small)
            </Typography>
            <ComponentLoadingScreen 
              message="Loading small component..." 
              size="small"
              showLogo={true}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Component Loading (Medium)
            </Typography>
            <ComponentLoadingScreen 
              message="Loading medium component..." 
              size="medium"
              showLogo={false}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Component Loading (Large)
            </Typography>
            <ComponentLoadingScreen 
              message="Loading large component..." 
              size="large"
              showLogo={true}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400, position: 'relative' }}>
            <Typography variant="h6" gutterBottom>
              Overlay Loading Demo
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Click the button to show overlay loading
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleShowOverlayLoading}
              disabled={showOverlayLoading}
            >
              Show Overlay Loading
            </Button>
            
            {/* Sample content */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                This is some content that would be covered by the overlay loading screen.
                The overlay provides a beautiful blur effect and loading indicator.
              </Typography>
            </Box>

            {showOverlayLoading && (
              <OverlayLoadingScreen 
                message="Processing request..." 
                size="medium"
                showLogo={true}
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Full Page Loading Demo */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Full Page Loading Demo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Experience the full-page loading screen with beautiful animations
        </Typography>
        
        <Button 
          variant="contained" 
          size="large"
          onClick={handleShowPageLoading}
          disabled={showPageLoading}
          sx={{ mr: 2 }}
        >
          Show Page Loading Screen
        </Button>
        
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          (Will auto-hide after 3 seconds)
        </Typography>
      </Box>

      {/* Theme Information */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: 'action.hover' }}>
        <Typography variant="h6" gutterBottom>
          🎯 Loading Screen Features
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" component="div">
              <strong>✨ Animations:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Smooth fade-in transitions</li>
                <li>Rotating spinner rings</li>
                <li>Pulsing glow effects</li>
                <li>Wave loading dots</li>
                <li>Gradient shimmer effects</li>
              </ul>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" component="div">
              <strong>🎨 Theme Support:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Perfect light/dark theme adaptation</li>
                <li>Dynamic color adjustments</li>
                <li>Smooth theme transitions</li>
                <li>Consistent brand colors</li>
                <li>Accessible contrast ratios</li>
              </ul>
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Page Loading Overlay */}
      {showPageLoading && (
        <PageLoadingScreen 
          message="Loading TaxiTub Application..." 
          size="large"
          showLogo={true}
        />
      )}
    </Box>
  );
};

export default LoadingScreenDemo;
