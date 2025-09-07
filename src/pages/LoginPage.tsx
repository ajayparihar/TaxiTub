// TaxiTub Module: Login Page
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Login page for Admin and QueuePal authentication

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Avatar,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  TrafficRounded,
} from "@mui/icons-material";
import { AuthService, LoginCredentials } from "../services/auth";
import { useNotification } from "../components";

interface LoginPageProps {
  userType: "Admin" | "QueuePal";
}

const LoginPage: React.FC<LoginPageProps> = ({ userType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess } = useNotification();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Get redirect path from state
  const from = (location.state as any)?.from?.pathname || 
    (userType === "Admin" ? "/admin" : "/queuepal");

  // Initialize Remember Me and saved credentials
  React.useEffect(() => {
    // SECURITY NOTE: Saved credentials are stored in localStorage only when the user opts in via "Remember me".
    // This is for MVP convenience and should not be used in production. Never store tokens/secrets here.
    const savedCredentials = localStorage.getItem(`taxitub_saved_${userType.toLowerCase()}`);
    const shouldRemember = localStorage.getItem(`taxitub_remember_${userType.toLowerCase()}`) === 'true';
    
    if (savedCredentials && shouldRemember) {
      const parsed = JSON.parse(savedCredentials);
      setCredentials(parsed);
      setRememberMe(true);
    }
  }, [userType]);

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await AuthService.login(credentials);
      
      if (result.success && result.data) {
        // Check if the login is for the correct user type
        if (result.data.role !== userType) {
          setError(`This login is for ${userType} only`);
          setLoading(false);
          return;
        }

        // Handle Remember Me functionality
        const storageKey = `taxitub_saved_${userType.toLowerCase()}`;
        const rememberKey = `taxitub_remember_${userType.toLowerCase()}`;
        
        // SECURITY NOTE: This persists username/password in localStorage for demo convenience.
        // Do NOT enable this behavior in production. Prefer token-based auth and secure storage.
        if (rememberMe) {
          localStorage.setItem(storageKey, JSON.stringify(credentials));
          localStorage.setItem(rememberKey, 'true');
        } else {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(rememberKey);
        }

        showSuccess(`Welcome back, ${result.data.name || result.data.username}.`);
        navigate(from, { replace: true });
      } else {
        setError(result.message || "Login failed");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userType === "Admin";
  const icon = isAdmin ? <AdminPanelSettings /> : <TrafficRounded />;
  const color = isAdmin ? "primary" : "secondary";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        px: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 480 }}>
        <Paper
          elevation={8}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 3,
            background: (theme) =>
              `linear-gradient(145deg, ${theme.palette.background.paper}, ${
                theme.palette.mode === "light" 
                  ? theme.palette.grey[50] 
                  : theme.palette.grey[900]
              })`,
          }}
        >
          <Avatar
            sx={{
              m: 1,
              bgcolor: `${color}.main`,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
          
          <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
            {userType} Login
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
            {isAdmin 
              ? "Access the admin dashboard to manage the taxi queue system" 
              : "Access the QueuePal dashboard to manage taxi queues"
            }
          </Typography>


          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={credentials.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              disabled={loading}
              placeholder="e.g., admin or queuepal01"
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  name="rememberMe"
                  color="primary"
                  disabled={loading}
                />
              }
              label="Remember me"
              sx={{ mb: 2, alignSelf: 'flex-start' }}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mb: 2,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Need to access a different section?
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate("/")}
                sx={{ textTransform: "none", minWidth: "auto", p: 0 }}
              >
                Go to Passenger
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default LoginPage;
