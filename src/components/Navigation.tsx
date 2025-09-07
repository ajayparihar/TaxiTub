// TaxiTub Module: Navigation Component
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Navigation bar for switching between Admin, QueuePal, and Passenger views

import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from "@mui/material";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import TrafficRoundedIcon from "@mui/icons-material/TrafficRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import { AuthService, User } from "../services/auth";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { useThemeMode } from "./ThemeModeProvider";

/**
 * Top-level navigation bar with role-aware menus, theme toggle, and authentication controls.
 * - Mobile: Drawer navigation with user info
 * - Desktop: Tabs synced to current route with user menu
 * Synchronizes tab selection with access rights and current user role.
 */
const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { mode, toggleMode } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Update current user on mount and location changes
  useEffect(() => {
    setCurrentUser(AuthService.getCurrentUser());
  }, [location.pathname]);

  // Filter menu items based on user role
  // Build navigation menu based on current authentication and user role
  const getMenuItems = () => {
    const baseItems = [
      { path: "/passenger", label: "Passenger", icon: <PeopleAltRoundedIcon />, public: true },
      { path: "/queuepal", label: "QueuePal", icon: <TrafficRoundedIcon />, role: "QueuePal" },
      { path: "/admin", label: "Admin", icon: <SettingsRoundedIcon />, role: "Admin" },
    ];

    return baseItems.filter(item => {
      if (item.public) return true;
      if (!currentUser) return false;
      if (currentUser.role === "Admin") return true; // Admin can access everything
      return item.role === currentUser.role;
    });
  };

  const menuItems = useMemo(() => getMenuItems(), [currentUser]);

  // Handle tab value - include login routes and map them to base routes
  // Only return tab values for routes that are actually available in menuItems
  // Map current route (including login subpaths) to tab selection, constrained by access rights
  const getTabValue = () => {
    const availablePaths = menuItems.map(item => item.path);
    
    if (location.pathname === "/passenger" && availablePaths.includes("/passenger")) return "/passenger";
    if ((location.pathname === "/queuepal" || location.pathname === "/queuepal/login") && availablePaths.includes("/queuepal")) return "/queuepal";
    if ((location.pathname === "/admin" || location.pathname === "/admin/login") && availablePaths.includes("/admin")) return "/admin";
    return false;
  };
  
  const value = useMemo(() => getTabValue(), [location.pathname, menuItems]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigate = (path: string) => {
    // Check if user has access to the route
    if (path === "/admin" && !AuthService.canAccessRoute("Admin")) {
      navigate("/admin/login");
      return;
    }
    if (path === "/queuepal" && !AuthService.canAccessRoute("QueuePal")) {
      navigate("/queuepal/login");
      return;
    }
    
    navigate(path);
    setMobileOpen(false);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setUserMenuAnchor(null);
    navigate("/passenger");
    setMobileOpen(false); // Close mobile drawer
  };

  const handleLogin = (userType: "Admin" | "QueuePal") => {
    const loginPath = userType === "Admin" ? "/admin/login" : "/queuepal/login";
    navigate(loginPath);
    setMobileOpen(false); // Close mobile drawer
  };

  const drawer = (
    <Box sx={{ width: 250, pt: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, mb: 2 }}>
        <Typography variant="h6">TaxiTub</Typography>
        <IconButton onClick={handleDrawerToggle} aria-label="Close menu">
          <CloseRoundedIcon />
        </IconButton>
      </Stack>
      
      {/* User info in mobile drawer */}
      {currentUser && (
        <Box sx={{ px: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: currentUser.role === "Admin" ? "primary.main" : "secondary.main" }}>
              <AccountCircleIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="bold">
                {currentUser.name || currentUser.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentUser.role}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={value === item.path}
              onClick={() => handleNavigate(item.path)}
              aria-label={`Navigate to ${item.label}`}
              role="menuitem"
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        
        {!currentUser && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleLogin("Admin")}>
                <ListItemIcon><LoginIcon /></ListItemIcon>
                <ListItemText primary="Admin Login" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleLogin("QueuePal")}>
                <ListItemIcon><LoginIcon /></ListItemIcon>
                <ListItemText primary="QueuePal Login" />
              </ListItemButton>
            </ListItem>
          </>
        )}
        
        {currentUser && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
      
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" color="transparent">
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {isMobile ? (
            <>
              <IconButton
                edge="start"
                onClick={handleDrawerToggle}
                aria-label="Open navigation menu"
                sx={{ mr: 2 }}
              >
                <MenuRoundedIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                TaxiTub
              </Typography>
              <IconButton aria-label="Toggle color theme" onClick={toggleMode} size="small">
                {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
              </IconButton>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ mr: 3 }}>
                TaxiTub
              </Typography>
              <Tabs
                value={value}
                onChange={(_, v) => handleNavigate(v)}
                textColor="primary"
                indicatorColor="primary"
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{ 
                  flexGrow: 1, 
                  minHeight: 48,
                  "& .MuiTab-root": {
                    minWidth: { xs: 100, sm: 120 },
                    fontSize: { xs: "0.75rem", sm: "0.875rem" }
                  }
                }}>
                {menuItems.map((item) => (
                  <Tab
                    key={item.path}
                    value={item.path}
                    icon={item.icon}
                    iconPosition="start"
                    label={item.label}
                    sx={{ minHeight: 48 }}
                  />
                ))}
              </Tabs>
              
              {/* Authentication UI */}
              <Stack direction="row" alignItems="center" spacing={2}>
                <IconButton aria-label="Toggle color theme" onClick={toggleMode} size="small">
                  {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
                </IconButton>
                
                {currentUser ? (
                  <>
                    {currentUser.name || currentUser.username ? (
                      <Button
                        onClick={handleUserMenuOpen}
                        startIcon={<AccountCircleIcon />}
                        variant="outlined"
                        size="small"
                        sx={{ textTransform: "none" }}
                      >
                        {currentUser.name || currentUser.username}
                      </Button>
                    ) : (
                      <IconButton
                        onClick={handleUserMenuOpen}
                        size="small"
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            borderColor: 'primary.main'
                          }
                        }}
                        aria-label="User menu"
                      >
                        <AccountCircleIcon />
                      </IconButton>
                    )}
                    <Menu
                      anchorEl={userMenuAnchor}
                      open={Boolean(userMenuAnchor)}
                      onClose={handleUserMenuClose}
                      transformOrigin={{ horizontal: "right", vertical: "top" }}
                      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                    >
                      <MenuItem disabled>
                        <Stack>
                          <Typography variant="body2" fontWeight="bold">
                            {currentUser.name || currentUser.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {currentUser.role}
                          </Typography>
                        </Stack>
                      </MenuItem>
                      <Divider />
                      <MenuItem onClick={handleLogout}>
                        <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                        Logout
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button
                      onClick={() => handleLogin("Admin")}
                      startIcon={<LoginIcon />}
                      variant="outlined"
                      size="small"
                      sx={{ textTransform: "none" }}
                    >
                      Admin
                    </Button>
                    <Button
                      onClick={() => handleLogin("QueuePal")}
                      startIcon={<LoginIcon />}
                      variant="outlined"
                      size="small"
                      sx={{ textTransform: "none" }}
                    >
                      QueuePal
                    </Button>
                  </Stack>
                )}
              </Stack>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navigation;
