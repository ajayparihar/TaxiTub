// TaxiTub Module: Responsive Form Components
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Mobile-optimized form layouts and components

import React from "react";
import {
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  Paper,
  Typography,
  Stack,
  useMediaQuery,
  useTheme,
  SelectChangeEvent,
} from "@mui/material";
import { BaseComponentProps } from "../types";
import { enhancedNeutral, alpha } from "../theme";

export interface FormFieldProps extends BaseComponentProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  size?: "small" | "medium";
  gridSize?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends Omit<FormFieldProps, "onChange"> {
  options: SelectOption[];
  onChange: (value: string | number) => void;
  displayEmpty?: boolean;
  emptyLabel?: string;
}

export interface ResponsiveFormProps extends BaseComponentProps {
  title?: string;
  onSubmit: (event: React.FormEvent) => void;
  children: React.ReactNode;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  paper?: boolean;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
}

// Responsive Text Field
export const ResponsiveTextField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  placeholder,
  fullWidth = true,
  size = "medium",
  gridSize = { xs: 12 },
  className,
  "data-testid": testId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const field = (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...(onBlur && { onBlur })}
      error={!!error}
      helperText={error}
      required={required}
      disabled={disabled}
      {...(placeholder && { placeholder })}
      fullWidth={fullWidth}
      size={isMobile ? "medium" : size}
      {...(className && { className })}
      {...(testId && { "data-testid": testId })}
      sx={{
        "& .MuiOutlinedInput-input": {
          fontSize: { xs: "1rem", sm: "0.875rem" },
          color: enhancedNeutral[50], // Enhanced text contrast
          '&::placeholder': {
            color: (enhancedNeutral as any)[400],
            opacity: 0.7
          }
        },
        "& .MuiInputLabel-root": {
          fontSize: { xs: "1rem", sm: "0.875rem" },
          color: enhancedNeutral[350], // Better label visibility
          '&.Mui-focused': {
            color: 'primary.main'
          }
        },
        "& .MuiOutlinedInput-root": {
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}` // Focus ring
            }
          }
        },
        "& .MuiFormHelperText-root": {
          color: enhancedNeutral[350] // Better helper text visibility
        }
      }}
    />
  );

  return gridSize ? (
    <Grid item {...gridSize}>
      {field}
    </Grid>
  ) : (
    field
  );
};

// Responsive Select Field
export const ResponsiveSelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  options,
  required = false,
  disabled = false,
  fullWidth = true,
  size = "medium",
  gridSize = { xs: 12 },
  displayEmpty = false,
  emptyLabel = "Select an option",
  className,
  "data-testid": testId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  const field = (
    <FormControl 
      fullWidth={fullWidth} 
      error={!!error} 
      size={isMobile ? "medium" : size}
      {...(className && { className })}
    >
      <InputLabel
        sx={{
          fontSize: { xs: "1rem", sm: "0.875rem" },
          color: enhancedNeutral[350], // Better label visibility
          '&.Mui-focused': {
            color: 'primary.main'
          }
        }}
      >
        {label}
        {required && " *"}
      </InputLabel>
      <Select
        value={String(value)}
        onChange={handleChange}
        {...(onBlur && { onBlur })}
        label={label + (required ? " *" : "")}
        disabled={disabled}
        displayEmpty={displayEmpty}
        {...(testId && { "data-testid": testId })}
        sx={{
          "& .MuiSelect-select": {
            fontSize: { xs: "1rem", sm: "0.875rem" },
            color: enhancedNeutral[50], // Enhanced text contrast
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}` // Focus ring
            }
          }
        }}
      >
        {displayEmpty && (
          <MenuItem value="">
            <em>{emptyLabel}</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem 
            key={String(option.value)} 
            value={String(option.value)}
            {...(option.disabled !== undefined && { disabled: option.disabled })}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );

  return gridSize ? (
    <Grid item {...gridSize}>
      {field}
    </Grid>
  ) : (
    field
  );
};

// Responsive Form Container
export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  title,
  onSubmit,
  children,
  loading = false,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onCancel,
  paper = true,
  maxWidth = "md",
  className,
  "data-testid": testId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const formContent = (
    <Box
      component="form"
      onSubmit={onSubmit}
      noValidate
      sx={{
        maxWidth: {
          xs: "100%",
          sm: maxWidth === "xs" ? 400 : maxWidth === "sm" ? 600 : 800,
          md: maxWidth === "lg" ? 1000 : maxWidth === "xl" ? 1200 : 900,
        },
        mx: "auto",
      }}
      className={className}
      data-testid={testId}
    >
      {title && (
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 3,
            fontSize: { xs: "1.1rem", sm: "1.25rem" },
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          {title}
        </Typography>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {children}
        
        {/* Form Actions */}
        <Grid item xs={12}>
          <Stack 
            direction={{ xs: "column", sm: "row" }} 
            spacing={2} 
            justifyContent={{ xs: "stretch", sm: "flex-end" }}
            sx={{ mt: { xs: 1, sm: 2 } }}
          >
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
                size={isMobile ? "large" : "medium"}
                sx={{ 
                  minWidth: { xs: "100%", sm: 120 },
                  order: { xs: 2, sm: 1 },
                }}
              >
                {cancelLabel}
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size={isMobile ? "large" : "medium"}
              sx={{ 
                minWidth: { xs: "100%", sm: 120 },
                order: { xs: 1, sm: 2 },
              }}
            >
              {loading ? "Loading..." : submitLabel}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );

  if (paper) {
    return (
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        {formContent}
      </Paper>
    );
  }

  return formContent;
};

// Responsive Form Section (for grouping fields)
export const ResponsiveFormSection: React.FC<{
  title: string;
  children: React.ReactNode;
  spacing?: number;
}> = ({ title, children, spacing = 2 }) => (
  <Grid item xs={12}>
    <Box sx={{ mb: spacing }}>
      <Typography 
        variant="subtitle1" 
        sx={{ 
          mb: 2, 
          fontWeight: 600,
          fontSize: { xs: "1rem", sm: "1.125rem" },
        }}
      >
        {title}
      </Typography>
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {children}
      </Grid>
    </Box>
  </Grid>
);

// Quick form field wrapper for common layouts
export const FormRow: React.FC<{
  children: React.ReactNode;
  spacing?: number;
}> = ({ children, spacing = 3 }) => (
  <Grid container spacing={{ xs: 2, sm: spacing }}>
    {children}
  </Grid>
);
