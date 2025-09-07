// TaxiTub Module: Error Boundary Component (MUI)
// Version: v0.2.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Converted to MUI glassmorphic UI, consistent with theme

import { Component, ErrorInfo, ReactNode } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Container,
  Collapse,
} from "@mui/material";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("TaxiTub Error Boundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center" }}>
          <Container maxWidth="sm">
            <Paper sx={{ p: 4 }}>
              <Stack spacing={2} alignItems="flex-start">
                <Typography variant="h4">Something went wrong</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  We encountered an unexpected error in TaxiTub. It has been
                  logged for review. You can try reloading the app or go back
                  to the home screen.
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<ReplayRoundedIcon />}
                    onClick={this.handleReload}
                  >
                    Reload Application
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<HomeRoundedIcon />}
                    onClick={this.handleGoHome}
                  >
                    Go to Home
                  </Button>
                </Stack>

                <Collapse in={import.meta.env.DEV && !!this.state.error}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Error Details (Development Only)
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
                      {this.state.error?.toString()}
                    </Typography>
                    {this.state.errorInfo && (
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap" }}>
                        {this.state.errorInfo.componentStack}
                      </Typography>
                    )}
                  </Box>
                </Collapse>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle1">What you can do:</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    • Try reloading the page using the button above
                    <br />• Go back to the homepage and try again
                    <br />• If the problem persists, please contact support
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
