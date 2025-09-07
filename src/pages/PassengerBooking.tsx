// TaxiTub Module: Passenger Booking
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Passenger interface for taxi booking with FIFO assignment using enhanced MUI components

import React, { useState, useEffect } from "react";
import { QueueService, BookingService } from "../services/api";
import { QueueView, CarInfo } from "../types";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  LocalTaxi as TaxiIcon,
  Phone as PhoneIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  ContentCopy as CopyIcon,
  Twitter as TwitterIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Telegram as TelegramIcon,
  Forum as DiscordIcon, // Using Forum icon for Discord
  QrCode as QrCodeIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import {
  DashboardLayout,
  ContentSection,
  EnhancedForm,
  useNotification,
  type FieldConfig,
} from '../components';

/**
 * Passenger-facing booking screen. Displays queue stats, collects booking details,
 * assigns a taxi via BookingService, and offers share/download options for assignment.
 */
const PassengerBooking: React.FC = () => {
  const [queues, setQueues] = useState<QueueView[]>([]);
  const [queuesLoading, setQueuesLoading] = useState(true);
  const [assignedCar, setAssignedCar] = useState<{ car: CarInfo; queuePosition: number; destination?: string } | null>(null);
  const [showAssignment, setShowAssignment] = useState(false);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);
  const [showTextDialog, setShowTextDialog] = useState(false);
  
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    loadQueues();
  }, []);

  /**
   * Fetches queues for all seater types and updates local state.
   * Silent error handling keeps UI responsive.
   */
  const loadQueues = async () => {
    try {
      setQueuesLoading(true);
      const result = await QueueService.getAllQueues();
      if (result.success) {
        setQueues(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load queue data:", error);
    } finally {
      setQueuesLoading(false);
    }
  };



  const getTotalCarsCount = () => {
    return queues.reduce((total, queue) => total + queue.cars.length, 0);
  };

  // Form configuration for booking
  const formFields: FieldConfig[] = [
    {
      name: 'passengerName',
      label: 'Passenger Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your full name',
      validation: {
        required: 'Passenger name is required',
        minLength: 2,
      },
      gridSize: { xs: 12, sm: 6, md: 4 },
      startAdornment: <PersonIcon sx={{ mr: 1, color: 'primary.main', fontSize: '20px' }} />,
    },
    {
      name: 'destination',
      label: 'Destination',
      type: 'text',
      required: true,
      placeholder: 'Where are you going?',
      validation: {
        required: 'Destination is required',
        minLength: 3,
      },
      gridSize: { xs: 12, sm: 6, md: 4 },
      startAdornment: <LocationIcon sx={{ mr: 1, color: 'primary.main', fontSize: '20px' }} />,
    },
    {
      name: 'passengerCount',
      label: 'Number of Passengers',
      type: 'select',
      required: true,
      defaultValue: 1,
      options: Array.from({ length: 8 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1} Passenger${i + 1 > 1 ? 's' : ''}`,
      })),
      gridSize: { xs: 12, sm: 12, md: 4 },
      startAdornment: <GroupsIcon sx={{ mr: 1, color: 'primary.main', fontSize: '20px' }} />,
    },
  ];

  /**
   * Submits booking request by assigning an appropriate taxi from the queue.
   * Refreshes queue state and surfaces user notifications on success/failure.
   */
  const handleBookingSubmit = async (formValues: Record<string, any>) => {
    try {
      const result = await BookingService.assignTaxi(
        formValues['passengerCount'],
        formValues['destination']
      );

      if (result.success && result.data) {
        setAssignedCar(result.data);
        setShowAssignment(true);
        loadQueues(); // Refresh queue status
        showSuccess('Taxi assigned');
      } else {
        showError(`Booking failed: ${result.message}`);
      }
    } catch (error) {
      showError('Failed to assign taxi. Please try again.');
    }
  };

  // Generate share text
  /**
   * Builds a human-readable summary of the assigned taxi for sharing.
   */
  const getShareText = () => {
    if (!assignedCar) return '';
    return `Taxi booked

Plate Number: ${assignedCar.car.plateNo}
Driver: ${assignedCar.car.driverName}
Phone: ${assignedCar.car.driverPhone}
Car: ${assignedCar.car.carModel} (${assignedCar.car.seater}-seater)${assignedCar.destination ? `
Destination: ${assignedCar.destination}` : ''}

📍 Please proceed to the taxi area and look for plate number ${assignedCar.car.plateNo}`;
  };

  // Share functionality
  

  const handleShareMenuClose = () => {
    setShareMenuAnchor(null);
  };
  
  
  // Simplified clipboard function that actually works on mobile
  const copyToClipboard = async (text: string): Promise<boolean> => {
    // Method 1: Try modern Clipboard API (works on HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        // Verify it was actually copied by reading it back
        const clipboardText = await navigator.clipboard.readText();
        return clipboardText === text;
      } catch (error) {
        console.log('Clipboard API failed:', error);
      }
    }
    
    // Method 2: Simple textarea approach for mobile
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Mobile-optimized styling
      Object.assign(textArea.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '200px',
        fontSize: '16px', // Prevent zoom on iOS
        border: `1px solid var(--border-soft)`,
        borderRadius: '4px',
        padding: '8px',
        zIndex: '10000',
backgroundColor: 'var(--bg-card)'
      });
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      
      // Give user a moment to see the text
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return success;
    } catch (error) {
      console.error('Fallback copy failed:', error);
      return false;
    }
  };

  /**
   * Executes platform-specific sharing behavior.
   * @param option - Platform-specific sharing option
   */
  const handleShareOption = async (option: string) => {
    if (!assignedCar) return;
    
    const shareText = getShareText();
    const encodedText = encodeURIComponent(shareText);
    
    switch (option) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?text=${encodedText}`);
        break;
      case 'discord':
        // Discord doesn't have direct URL sharing, so we copy and show instructions
        const discordSuccess = await copyToClipboard(shareText);
        if (discordSuccess) {
          showSuccess('Copied to clipboard. You can now paste this in Discord.');
        } else {
          showError('Clipboard blocked by browser. Please copy the text from the dialog that opens.');
          setShowTextDialog(true);
        }
        break;
      case 'twitter':
        const twitterText = encodeURIComponent(`🚕 ${shareText} #TaxiTub`);
        window.open(`https://twitter.com/intent/tweet?text=${twitterText}`);
        break;
      case 'facebook':
        const fbText = encodeURIComponent(`Taxi booked via TaxiTub: ${shareText}`);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${fbText}`);
        break;
      case 'linkedin':
        const linkedinText = encodeURIComponent(`Taxi Assignment Details: ${shareText}`);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent('TaxiTub - Taxi Assignment')}&summary=${linkedinText}`);
        break;
      case 'sms':
        window.open(`sms:?body=${encodedText}`);
        break;
      case 'email':
        const subject = encodeURIComponent('TaxiTub - Taxi Assignment');
        window.open(`mailto:?subject=${subject}&body=${encodedText}`);
        break;
      case 'copy':
        const copySuccess = await copyToClipboard(shareText);
        if (copySuccess) {
          showSuccess('Taxi details copied to clipboard!');
        } else {
          showError('Copy failed. Manual copy dialog will open.');
          setShowTextDialog(true);
        }
        break;
      case 'qr':
        // Generate QR code with the share text
        try {
          const qrText = encodeURIComponent(shareText);
          window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrText}`, '_blank');
          showSuccess('QR code generated in new tab.');
        } catch (error) {
          showError('Failed to generate QR code');
        }
        break;
      case 'print':
        // Create a printable version
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>TaxiTub - Taxi Assignment</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 40px; }
                  .header { color: var(--primary); font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                  .content { white-space: pre-line; font-size: 16px; line-height: 1.6; }
                </style>
              </head>
              <body>
                <div class="header">TaxiTub - Taxi Assignment</div>
                <div class="content">${shareText}</div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'TaxiTub - Taxi Assignment',
              text: shareText,
            });
          } catch (error) {
            // User cancelled or share failed
          }
        }
        break;
    }
    
    handleShareMenuClose();
  };

  // Download card as image
  /**
   * Generates an image card with assignment details and downloads it as JPEG.
   */
  const handleDownload = async () => {
    if (!assignedCar) return;
    
    // Create canvas for the card
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 600;
    canvas.height = 400;
    
    // Get theme colors from CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    const colors = {
      background: rootStyles.getPropertyValue('--bg-app').trim(),
      cardBg: rootStyles.getPropertyValue('--bg-card').trim(), 
      primary: rootStyles.getPropertyValue('--primary').trim(),
      accent: rootStyles.getPropertyValue('--info').trim(),
      text: rootStyles.getPropertyValue('--text-strong').trim(),
      textSecondary: rootStyles.getPropertyValue('--text-body').trim()
    };
    
    // Background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Header
    ctx.fillStyle = colors.primary;
    ctx.fillRect(0, 0, canvas.width, 60);
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Taxi assigned', canvas.width/2, 35);
    
    // Card background
    ctx.fillStyle = colors.cardBg;
    ctx.fillRect(50, 80, canvas.width-100, 280);
    
    // Content
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Your Assigned Taxi', 80, 120);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText('Plate Number', 80, 150);
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 28px Arial';
    ctx.fillText(assignedCar.car.plateNo, 80, 180);
    
    ctx.fillStyle = colors.textSecondary;
    ctx.font = '14px Arial';
    ctx.fillText('Car Details', 80, 210);
    ctx.fillStyle = colors.text;
    ctx.font = '16px Arial';
    ctx.fillText(`${assignedCar.car.carModel} (${assignedCar.car.seater}-seater)`, 80, 235);
    
    if (assignedCar.destination) {
      ctx.fillStyle = colors.textSecondary;
      ctx.font = '14px Arial';
      ctx.fillText('Destination', 80, 265);
      ctx.fillStyle = colors.text;
      ctx.font = '16px Arial';
      ctx.fillText(assignedCar.destination, 80, 290);
    }
    
    ctx.fillStyle = colors.textSecondary;
    ctx.font = '14px Arial';
    ctx.fillText('Driver', 80, assignedCar.destination ? 320 : 280);
    ctx.fillStyle = colors.text;
    ctx.font = '16px Arial';
    ctx.fillText(`${assignedCar.car.driverName} - ${assignedCar.car.driverPhone}`, 80, assignedCar.destination ? 345 : 305);
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taxi-${assignedCar.car.plateNo}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('Taxi card downloaded.');
      }
    }, 'image/jpeg', 0.9);
  };


  return (
    <DashboardLayout
      title="Book Your Taxi"
      subtitle=""
    >
      {showAssignment && assignedCar ? (
        <ContentSection
          title="Taxi assigned"
              actions={[
                {
                  label: '',
                  icon: <ShareIcon />,
                  onClick: (event) => {
                    // Use the event target as anchor to prevent focus issues
                    if (event) {
                      setShareMenuAnchor(event.currentTarget);
                    }
                  },
                  variant: 'outlined',
                  'aria-label': 'Share taxi details',
                  'aria-haspopup': 'menu' as const,
                  'aria-expanded': Boolean(shareMenuAnchor),
                  id: 'share-button',
                },
            {
              label: '',
              icon: <DownloadIcon />,
              onClick: handleDownload,
              variant: 'outlined',
            },
            {
              label: 'Book Another Taxi',
              icon: <TaxiIcon />,
              onClick: () => setShowAssignment(false),
              variant: 'contained',
            },
          ]}
        >
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TaxiIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Your assigned taxi
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Plate Number
                    </Typography>
                    <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                      {assignedCar.car.plateNo}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Car Details
                    </Typography>
                    <Typography variant="body1">
                      {assignedCar.car.carModel} ({assignedCar.car.seater}-seater)
                    </Typography>
                  </Box>
                  {assignedCar.destination && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Destination
                      </Typography>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon fontSize="small" color="primary" />
                        {assignedCar.destination}
                      </Typography>
                    </Box>
                  )}
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Driver
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {assignedCar.car.driverName}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body1">{assignedCar.car.driverPhone}</Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PhoneIcon />}
                      onClick={() => window.open(`tel:${assignedCar.car.driverPhone}`)}
                    >
                      Call Driver
                    </Button>
                  </Stack>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="primary.contrastText" sx={{ textAlign: 'center' }}>
                      Please proceed to the taxi area and look for plate number <strong>{assignedCar.car.plateNo}</strong>
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>
          
          {/* Share Menu */}
          <Menu
            anchorEl={shareMenuAnchor}
            open={Boolean(shareMenuAnchor)}
            onClose={handleShareMenuClose}
            PaperProps={{
              sx: { minWidth: 220, maxHeight: 400 }
            }}
            MenuListProps={{
              'aria-labelledby': 'share-button',
              autoFocus: true,
              autoFocusItem: true,
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {/* Messaging Apps */}
            <MenuItem onClick={() => handleShareOption('whatsapp')}>
              <ListItemIcon>
                <WhatsAppIcon sx={{ color: '#25D366' }} />
              </ListItemIcon>
              <ListItemText>WhatsApp</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleShareOption('telegram')}>
              <ListItemIcon>
                <TelegramIcon sx={{ color: '#0088cc' }} />
              </ListItemIcon>
              <ListItemText>Telegram</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleShareOption('discord')}>
              <ListItemIcon>
                <DiscordIcon sx={{ color: '#5865F2' }} />
              </ListItemIcon>
              <ListItemText>Discord</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleShareOption('sms')}>
              <ListItemIcon>
                <SmsIcon color="primary" />
              </ListItemIcon>
              <ListItemText>SMS</ListItemText>
            </MenuItem>
            
            {/* Social Media */}
            <MenuItem onClick={() => handleShareOption('twitter')}>
              <ListItemIcon>
                <TwitterIcon sx={{ color: '#1DA1F2' }} />
              </ListItemIcon>
              <ListItemText>Twitter</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleShareOption('facebook')}>
              <ListItemIcon>
                <FacebookIcon sx={{ color: '#1877F2' }} />
              </ListItemIcon>
              <ListItemText>Facebook</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleShareOption('linkedin')}>
              <ListItemIcon>
                <LinkedInIcon sx={{ color: '#0A66C2' }} />
              </ListItemIcon>
              <ListItemText>LinkedIn</ListItemText>
            </MenuItem>
            
            {/* Email & Clipboard */}
            <MenuItem onClick={() => handleShareOption('email')}>
              <ListItemIcon>
                <EmailIcon color="secondary" />
              </ListItemIcon>
              <ListItemText>Email</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleShareOption('copy')}>
              <ListItemIcon>
                <CopyIcon />
              </ListItemIcon>
              <ListItemText>Copy to Clipboard</ListItemText>
            </MenuItem>
            
            {/* Advanced Options */}
            <MenuItem onClick={() => handleShareOption('qr')}>
              <ListItemIcon>
                <QrCodeIcon sx={{ color: (t) => t.palette.text.primary }} />
              </ListItemIcon>
              <ListItemText>Generate QR Code</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleShareOption('print')}>
              <ListItemIcon>
                <PrintIcon sx={{ color: (t) => t.palette.text.secondary }} />
              </ListItemIcon>
              <ListItemText>Print Details</ListItemText>
            </MenuItem>
            
            {/* Native Share */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <MenuItem onClick={() => handleShareOption('native')}>
                <ListItemIcon>
                  <ShareIcon />
                </ListItemIcon>
                <ListItemText>More Options...</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </ContentSection>
      ) : (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Grid container spacing={4}>
            {/* Booking Form */}
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <EnhancedForm
                    fields={formFields}
                    onSubmit={handleBookingSubmit}
                    submitText={
                      queuesLoading 
                        ? "Loading..." 
                        : getTotalCarsCount() === 0 
                          ? "No Taxis Available" 
                          : "Get My Taxi"
                    }
                    loading={queuesLoading}
                    paper={false}
                    spacing={2.5}
                    columns={3}
                    initialValues={{
                      passengerName: '',
                      destination: '',
                      passengerCount: 1,
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Manual Copy Dialog */}
      <Dialog
        open={showTextDialog}
        onClose={() => setShowTextDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Copy Taxi Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please select all the text below and copy it manually:
          </Typography>
          <TextField
            multiline
            rows={8}
            value={assignedCar ? getShareText() : ''}
            variant="outlined"
            fullWidth
            InputProps={{
              readOnly: true,
              sx: {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: 1.4
              }
            }}
            onClick={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.select();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTextDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
};

export default PassengerBooking;
