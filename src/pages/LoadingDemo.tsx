// TaxiTub Demo: Enhanced Loading Screen Showcase
// Version: v0.1.0
// Last Updated: 2025-09-07
// Author: AI Agent
// Purpose: Demonstrate the new loading screens across different themes and variants

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Paper,
} from '@mui/material';
import {
  PageLoadingScreen,
  OverlayLoadingScreen,
  ComponentLoadingScreen,
} from '../components/EnhancedLoadingScreen';
import { useThemeMode } from '../components/ThemeModeProvider';

const LoadingDemo: React.FC = () => {
  const { mode, toggleMode } = useThemeMode();
  const [showPageLoading, setShowPageLoading] = useState(false);
  const [showOverlayLoading, setShowOverlayLoading] = useState(false);
  const [showComponentLoading, setShowComponentLoading] = useState(false);

  const demoMessages = [
    'Loading Dashboard...',
    'Preparing your data...',
    'Connecting to services...',
    'Almost ready...',
    'Loading TaxiTub...',
  ];

  const [currentMessage, setCurrentMessage] = useState(0);

  const cycleMessage = () => {
    setCurrentMessage((prev) => (prev + 1) % demoMessages.length);
  };

  // Auto-close page loading after 5 seconds
  useEffect(() => {
    if (showPageLoading) {
      const timer = setTimeout(() => setShowPageLoading(false), 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showPageLoading]);

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
          Enhanced Loading Screen Demo
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Showcase of the new theme-aware loading screens with anti-flicker design.
        </Typography>
        
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <FormControlLabel
            control={<Switch checked={mode === 'dark'} onChange={toggleMode} />}
            label={`${mode === 'dark' ? 'Dark' : 'Light'} Theme`}
          />
          <Button variant="outlined" onClick={cycleMessage}>
            Change Message
          </Button>
        </Stack>
        
        <Divider />
      </Box>

      {/* Component Loading Examples */}
      <Grid container spacing={4}>
        {/* Component Variant */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Component Loading
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Inline loading for content areas and components.
              </Typography>
              
              <Paper sx={{ p: 2, minHeight: 200, position: 'relative' }}>
                <ComponentLoadingScreen
                  message={demoMessages[currentMessage] || 'Loading...'}
                  showLogo={true}
                  size={48}
                />
              </Paper>
              
              <Button
                variant="contained"
                onClick={() => setShowComponentLoading(!showComponentLoading)}
                sx={{ mt: 2 }}
                fullWidth
              >
                {showComponentLoading ? 'Hide' : 'Show'} Component Loading
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Logo vs Spinner */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Logo vs Spinner
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Compare branded logo loading vs spinner loading.
              </Typography>
              
              <Stack spacing={3}>
                <Paper sx={{ p: 2, minHeight: 120 }}>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                    With Logo
                  </Typography>
                  <ComponentLoadingScreen
                    message="Loading with brand..."
                    showLogo={true}
                    size={40}
                  />
                </Paper>
                
                <Paper sx={{ p: 2, minHeight: 120 }}>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                    With Spinner
                  </Typography>
                  <ComponentLoadingScreen
                    message="Loading with spinner..."
                    showLogo={false}
                    size={40}
                  />
                </Paper>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Overlay Loading */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Overlay Loading
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Overlay loading for cards and sections with backdrop blur.
              </Typography>
              
              <Paper sx={{ p: 3, minHeight: 200, position: 'relative' }}>
                <Typography variant="h6">Sample Content</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  This content will be covered by the overlay loading when active.
                </Typography>
                
                {showOverlayLoading && (
                  <OverlayLoadingScreen
                    message="Processing request..."
                    showLogo={true}
                    size={40}
                  />
                )}
              </Paper>
              
              <Button
                variant="contained"
                onClick={() => setShowOverlayLoading(!showOverlayLoading)}
                sx={{ mt: 2 }}
                fullWidth
              >
                {showOverlayLoading ? 'Hide' : 'Show'} Overlay Loading
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Page Loading */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Page Loading
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Full-screen page loading for route transitions.
              </Typography>
              
              <Button
                variant="contained"
                onClick={() => setShowPageLoading(true)}
                fullWidth
                sx={{ mb: 2 }}
              >
                Show Page Loading (5 seconds)
              </Button>
              
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                This will show a full-screen loading overlay similar to what you see 
                when navigating between routes.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Features Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Enhanced Loading Features
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
                      🎨
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Theme Aware
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Adapts colors and styling based on light/dark theme
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
                      ⚡
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Anti-Flicker
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Smooth transitions prevent loading state flickering
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
                      🔄
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Smooth Animations
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Layered animations with pulse, shimmer, and fade effects
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
                      📱
                    </Typography>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Responsive
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Works beautifully across all device sizes
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Full Page Loading Demo */}
      {showPageLoading && (
        <PageLoadingScreen
          message="Loading complete application..."
          showLogo={true}
          size={60}
          onClose={() => setShowPageLoading(false)}
        />
      )}
    </Box>
  );
};

export default LoadingDemo;
