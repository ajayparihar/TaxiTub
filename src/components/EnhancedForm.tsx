// TaxiTub Module: Enhanced Form System
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Advanced form components with validation, better error handling, and consistent patterns

import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Button,
  Stack,
  Paper,
  Typography,
  Grid,
  Chip,
  IconButton,
  InputAdornment,
  Autocomplete,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  Fade,
  LinearProgress,
  Collapse,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { useNotification } from './NotificationProvider';

// Validation types
type ValidationRule<T = any> = {
  required?: boolean | string;
  min?: number | string;
  max?: number | string;
  minLength?: number | string;
  maxLength?: number | string;
  pattern?: RegExp | string;
  custom?: (value: T, allValues: Record<string, any>) => string | boolean;
  dependencies?: string[]; // Fields this validation depends on
};

type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url'
  | 'select' 
  | 'multiselect'
  | 'autocomplete'
  | 'radio' 
  | 'checkbox' 
  | 'switch'
  | 'textarea'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'array'
  | 'file';

interface FieldOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  defaultValue?: any;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  options?: FieldOption[];
  validation?: ValidationRule;
  gridSize?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  autoComplete?: string;
  dependencies?: string[]; // Fields that should trigger re-validation of this field
  conditional?: {
    field: string;
    value: any;
    operator?: '==' | '!=' | '>' | '<' | 'includes' | 'excludes';
  };
  // Array field specific
  arrayConfig?: {
    addButtonText?: string;
    removeButtonText?: string;
    minItems?: number;
    maxItems?: number;
    itemLabel?: (index: number) => string;
    itemFields?: FieldConfig[];
  };
}

interface FormSection {
  title: string;
  description?: string;
  fields: string[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface EnhancedFormProps {
  fields: FieldConfig[];
  sections?: FormSection[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  onValidate?: (values: Record<string, any>) => Record<string, string> | Promise<Record<string, string>>;
  onChange?: (values: Record<string, any>, changedField: string) => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
  description?: string;
  submitText?: string;
  resetText?: string;
  showReset?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  paper?: boolean;
  spacing?: number;
  columns?: 1 | 2 | 3;
  stickyActions?: boolean;
}

// Validation helpers
const validateField = (value: any, validation: ValidationRule, allValues: Record<string, any>): string | null => {
  if (!validation) return null;

  // Required validation
  if (validation.required) {
    const isEmpty = value === null || value === undefined || value === '' || 
                   (Array.isArray(value) && value.length === 0);
    if (isEmpty) {
      return typeof validation.required === 'string' ? validation.required : 'This field is required';
    }
  }

  // Skip other validations if field is empty and not required
  if (!value && !validation.required) return null;

  // String validations
  if (typeof value === 'string') {
    if (validation.minLength && typeof validation.minLength === 'number' && value.length < validation.minLength) {
      return typeof validation.minLength === 'string' 
        ? validation.minLength 
        : `Minimum length is ${validation.minLength} characters`;
    }
    if (validation.maxLength && typeof validation.maxLength === 'number' && value.length > validation.maxLength) {
      return typeof validation.maxLength === 'string' 
        ? validation.maxLength 
        : `Maximum length is ${validation.maxLength} characters`;
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (validation.min && typeof validation.min === 'number' && value < validation.min) {
      return typeof validation.min === 'string' 
        ? validation.min 
        : `Minimum value is ${validation.min}`;
    }
    if (validation.max && typeof validation.max === 'number' && value > validation.max) {
      return typeof validation.max === 'string' 
        ? validation.max 
        : `Maximum value is ${validation.max}`;
    }
  }

  // Pattern validation
  if (validation.pattern) {
    const pattern = typeof validation.pattern === 'string' ? new RegExp(validation.pattern) : validation.pattern;
    if (!pattern.test(String(value))) {
      return 'Invalid format';
    }
  }

  // Custom validation
  if (validation.custom) {
    const result = validation.custom(value, allValues);
    if (typeof result === 'string') return result;
    if (result === false) return 'Invalid value';
  }

  return null;
};

// Field component
interface FormFieldProps {
  config: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
  allValues: Record<string, any>;
}

const FormField: React.FC<FormFieldProps> = ({ 
  config, 
  value, 
  onChange, 
  onBlur, 
  error, 
  disabled,
  allValues 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Check conditional visibility
  if (config.conditional) {
    const conditionValue = allValues[config.conditional.field];
    const operator = config.conditional.operator || '==';
    
    let isVisible = false;
    switch (operator) {
      case '==':
        isVisible = conditionValue === config.conditional.value;
        break;
      case '!=':
        isVisible = conditionValue !== config.conditional.value;
        break;
      case '>':
        isVisible = conditionValue > config.conditional.value;
        break;
      case '<':
        isVisible = conditionValue < config.conditional.value;
        break;
      case 'includes':
        isVisible = Array.isArray(conditionValue) && conditionValue.includes(config.conditional.value);
        break;
      case 'excludes':
        isVisible = Array.isArray(conditionValue) && !conditionValue.includes(config.conditional.value);
        break;
    }
    
    if (!isVisible) return null;
  }

  const baseProps = {
    disabled: disabled || config.disabled || false,
    fullWidth: config.fullWidth !== false,
    error: !!error,
    ...(error || config.helperText ? { helperText: error || config.helperText } : {}),
    onBlur,
  };

  switch (config.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'tel':
      return (
        <TextField
          {...baseProps}
          label={config.label}
          type={config.type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          {...(config.placeholder && { placeholder: config.placeholder })}
          {...(config.autoComplete && { autoComplete: config.autoComplete })}
          InputProps={{
            startAdornment: config.startAdornment,
            endAdornment: config.endAdornment,
          }}
        />
      );

    case 'password':
      return (
        <TextField
          {...baseProps}
          label={config.label}
          type={showPassword ? 'text' : 'password'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          {...(config.placeholder && { placeholder: config.placeholder })}
          {...(config.autoComplete && { autoComplete: config.autoComplete })}
          InputProps={{
            startAdornment: config.startAdornment,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
                {config.endAdornment}
              </InputAdornment>
            ),
          }}
        />
      );

    case 'number':
      return (
        <TextField
          {...baseProps}
          label={config.label}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          {...(config.placeholder && { placeholder: config.placeholder })}
          InputProps={{
            startAdornment: config.startAdornment,
            endAdornment: config.endAdornment,
          }}
        />
      );

    case 'textarea':
      return (
        <TextField
          {...baseProps}
          label={config.label}
          multiline
          rows={config.rows || 4}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          {...(config.placeholder && { placeholder: config.placeholder })}
        />
      );

    case 'select':
      return (
        <FormControl {...baseProps} error={!!error}>
          <InputLabel>{config.label}</InputLabel>
          <Select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            label={config.label}
          >
            {config.options?.map((option) => (
              <MenuItem 
                key={String(option.value)} 
                value={option.value}
                disabled={option.disabled || false}
              >
                <div>
                  <Typography variant="body1">{option.label}</Typography>
                  {option.description && (
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  )}
                </div>
              </MenuItem>
            ))}
          </Select>
          {(error || config.helperText) && (
            <FormHelperText>{error || config.helperText}</FormHelperText>
          )}
        </FormControl>
      );

    case 'multiselect':
      return (
        <FormControl {...baseProps} error={!!error}>
          <InputLabel>{config.label}</InputLabel>
          <Select
            multiple
            value={value || []}
            onChange={(e) => onChange(e.target.value)}
            label={config.label}
            renderValue={(selected: any[]) => (
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {selected.map((val) => {
                  const option = config.options?.find(opt => opt.value === val);
                  return (
                    <Chip
                      key={String(val)}
                      label={option?.label || String(val)}
                      size="small"
                    />
                  );
                })}
              </Stack>
            )}
          >
            {config.options?.map((option) => (
              <MenuItem 
                key={String(option.value)} 
                value={option.value}
                disabled={option.disabled || false}
              >
                <Checkbox checked={(value || []).includes(option.value)} />
                <div style={{ marginLeft: 8 }}>
                  <Typography variant="body1">{option.label}</Typography>
                  {option.description && (
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  )}
                </div>
              </MenuItem>
            ))}
          </Select>
          {(error || config.helperText) && (
            <FormHelperText>{error || config.helperText}</FormHelperText>
          )}
        </FormControl>
      );

    case 'autocomplete':
      return (
        <Autocomplete
          options={config.options || []}
          value={config.options?.find(opt => opt.value === value) || null}
          onChange={(_, newValue) => onChange(newValue?.value || null)}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value?.value}
        disabled={disabled || config.disabled || false}
          renderInput={(params) => {
            const { size, InputLabelProps = {}, InputProps = {}, inputProps = {}, ...restParams } = params;
            return (
              <TextField
                {...restParams}
                label={config.label}
                error={!!error}
                {...(error || config.helperText ? { helperText: error || config.helperText } : {})}
                {...(config.placeholder ? { placeholder: config.placeholder } : {})}
                {...(size ? { size } : {})}
                InputLabelProps={Object.fromEntries(
                  Object.entries(InputLabelProps).filter(([_, value]) => value !== undefined)
                )}
                InputProps={{
                  ...InputProps,
                }}
                inputProps={{
                  ...inputProps,
                }}
              />
            );
          }}
        />
      );

    case 'radio':
      return (
        <FormControl component="fieldset" error={!!error} disabled={disabled || config.disabled || false}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {config.label}
          </Typography>
          <RadioGroup
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            {config.options?.map((option) => (
              <FormControlLabel
                key={String(option.value)}
                value={option.value}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    {option.description && (
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    )}
                  </Box>
                }
                disabled={option.disabled || false}
              />
            ))}
          </RadioGroup>
          {(error || config.helperText) && (
            <FormHelperText>{error || config.helperText}</FormHelperText>
          )}
        </FormControl>
      );

    case 'checkbox':
      if (config.options && config.options.length > 1) {
        // Multiple checkboxes
        return (
          <FormControl component="fieldset" error={!!error} disabled={disabled || config.disabled || false}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {config.label}
            </Typography>
            <FormGroup>
              {config.options.map((option) => (
                <FormControlLabel
                  key={String(option.value)}
                  control={
                    <Checkbox
                      checked={(value || []).includes(option.value)}
                      onChange={(e) => {
                        const newValue = value || [];
                        if (e.target.checked) {
                          onChange([...newValue, option.value]);
                        } else {
                          onChange(newValue.filter((v: any) => v !== option.value));
                        }
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">{option.label}</Typography>
                      {option.description && (
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      )}
                    </Box>
                  }
                  disabled={option.disabled || false}
                />
              ))}
            </FormGroup>
            {(error || config.helperText) && (
              <FormHelperText>{error || config.helperText}</FormHelperText>
            )}
          </FormControl>
        );
      } else {
        // Single checkbox
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled || config.disabled || false}
              />
            }
            label={config.label}
          />
        );
      }

    case 'switch':
      return (
        <FormControlLabel
          control={
            <Switch
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled || config.disabled || false}
            />
          }
          label={config.label}
        />
      );

    case 'date':
    case 'time':
    case 'datetime-local':
      return (
        <TextField
          {...baseProps}
          label={config.label}
          type={config.type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
        />
      );

    case 'array':
      const arrayValue = value || [];
      const { arrayConfig } = config;
      const minItems = arrayConfig?.minItems || 0;
      const maxItems = arrayConfig?.maxItems;

      return (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">{config.label}</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={() => onChange([...arrayValue, {}])}
              disabled={Boolean(maxItems && arrayValue.length >= maxItems)}
              size="small"
            >
              {arrayConfig?.addButtonText || 'Add Item'}
            </Button>
          </Stack>
          
          <Stack spacing={2}>
            {arrayValue.map((item: any, index: number) => (
              <Paper key={index} sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {arrayConfig?.itemLabel?.(index) || `Item ${index + 1}`}
                  </Typography>
                  <IconButton
                    onClick={() => {
                      const newArray = [...arrayValue];
                      newArray.splice(index, 1);
                      onChange(newArray);
                    }}
                    disabled={arrayValue.length <= minItems || false}
                    size="small"
                    aria-label={`Remove ${arrayConfig?.itemLabel?.(index) || `item ${index + 1}`}`}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Stack>
                
                {/* Render item fields */}
                {arrayConfig?.itemFields?.map((fieldConfig) => (
                  <Box key={fieldConfig.name} sx={{ mb: 2 }}>
                    <FormField
                      config={fieldConfig}
                      value={item[fieldConfig.name]}
                      onChange={(newValue) => {
                        const newArray = [...arrayValue];
                        newArray[index] = { ...newArray[index], [fieldConfig.name]: newValue };
                        onChange(newArray);
                      }}
                      onBlur={() => {}}
                      disabled={disabled || false}
                      allValues={allValues}
                    />
                  </Box>
                ))}
              </Paper>
            ))}
          </Stack>
          
          {error && (
            <Typography color="error" variant="caption" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      );

    default:
      return (
        <TextField
          {...baseProps}
          label={config.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          {...(config.placeholder && { placeholder: config.placeholder })}
        />
      );
  }
};

// Main form component
export const EnhancedForm: React.FC<EnhancedFormProps> = ({
  fields,
  sections,
  initialValues = {},
  onSubmit,
  onValidate,
  onChange,
  loading = false,
  disabled = false,
  title,
  description,
  submitText = 'Submit',
  resetText = 'Reset',
  showReset = false,
  autoSave = false,
  autoSaveDelay = 1000,
  paper = true,
  spacing = 3,
  columns = 1,
  stickyActions = false,
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  const { showError } = useNotification();

  // Initialize expanded sections
  useEffect(() => {
    if (sections) {
      const initial: Record<string, boolean> = {};
      sections.forEach(section => {
        initial[section.title] = section.defaultExpanded !== false;
      });
      setExpandedSections(initial);
    }
  }, [sections]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;
    
    const timeoutId = setTimeout(() => {
      if (Object.keys(touched).length > 0) {
        // Implement auto-save logic here
        // Auto-save functionality would go here
      }
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [values, autoSave, autoSaveDelay, touched]);

  // Validation
  const validateForm = useCallback(async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    // Field validation
    for (const field of fields) {
      const value = values[field.name];
      const error = validateField(value, field.validation || {}, values);
      if (error) {
        newErrors[field.name] = error;
      }
    }

    // Custom form validation
    if (onValidate) {
      try {
        const customErrors = await onValidate(values);
        Object.assign(newErrors, customErrors);
      } catch (error) {
        console.error('Validation error:', error);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, values, onValidate]);

  // Handle field change
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when field changes
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Re-validate dependent fields
    const dependentFields = fields.filter(f => f.dependencies?.includes(fieldName));
    dependentFields.forEach(field => {
      const error = validateField(values[field.name], field.validation || {}, { ...values, [fieldName]: value });
      setErrors(prev => ({
        ...prev,
        [field.name]: error || '',
      }));
    });

    onChange?.(values, fieldName);
  }, [values, errors, fields, onChange]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate field on blur
    const field = fields.find(f => f.name === fieldName);
    if (field) {
      const value = values[fieldName];
      const error = validateField(value, field.validation || {}, values);
      setErrors(prev => ({ ...prev, [fieldName]: error || '' }));
    }
  }, [fields, values]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || loading || disabled) return;

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    fields.forEach(field => {
      allTouched[field.name] = true;
    });
    setTouched(allTouched);

    // Validate form
    const isValid = await validateForm();
    if (!isValid) {
      showError('Please fix the errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      // Success toast handled by caller to avoid duplicate notifications
    } catch (error) {
      console.error('Submit error:', error);
      showError('Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  // Group fields by sections or create default layout
  const fieldGroups = sections 
    ? sections.map(section => ({
        ...section,
        fields: fields.filter(field => section.fields.includes(field.name)),
      }))
    : [{ title: '', fields: fields || [], description: '' }];

  const content = (
    <Box sx={{ p: paper ? { xs: 2, sm: 3 } : 0 }}>
      {/* Header */}
      {title && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      )}

      {/* Progress indicator */}
      {(loading || isSubmitting) && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={spacing}>
          {fieldGroups.map((group, groupIndex) => (
            <Box key={group.title || groupIndex}>
              {/* Section header */}
              {group.title && (
                <Box sx={{ mb: 2 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (sections?.find(s => s.title === group.title)?.collapsible) {
                        setExpandedSections(prev => ({
                          ...prev,
                          [group.title]: !prev[group.title],
                        }));
                      }
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {group.title}
                    </Typography>
                    {sections?.find(s => s.title === group.title)?.collapsible && (
                      <IconButton size="small">
                        {expandedSections[group.title] ? <RemoveIcon /> : <AddIcon />}
                      </IconButton>
                    )}
                  </Stack>
                  {group.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {group.description}
                    </Typography>
                  )}
                  <Divider sx={{ mt: 1 }} />
                </Box>
              )}

              {/* Section fields */}
              <Collapse 
                in={!group.title || expandedSections[group.title] !== false}
                timeout={300}
              >
                <Grid container spacing={{ xs: 2, sm: 3 }} columns={12}>
                  {(group.fields || []).map((field) => {
                    const gridSize = field.gridSize || { 
                      xs: 12, 
                      sm: columns === 1 ? 12 : columns === 2 ? 6 : 4 
                    };

                    return (
                      <Grid item key={field.name} {...gridSize}>
                        <FormField
                          config={field}
                          value={values[field.name]}
                          onChange={(value) => handleFieldChange(field.name, value)}
                          onBlur={() => handleFieldBlur(field.name)}
                          {...(touched[field.name] && errors[field.name] ? { error: errors[field.name] } : {})}
                          disabled={disabled || loading || isSubmitting}
                          allValues={values}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </Collapse>
            </Box>
          ))}

          {/* Actions */}
          <Box
            sx={{
              pt: 2,
              ...(stickyActions && {
                position: 'sticky',
                bottom: 0,
                bgcolor: 'background.paper',
                borderTop: 1,
                borderColor: 'divider',
                mt: 3,
                mx: -2,
                px: 2,
                py: 2,
              }),
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent={{ xs: 'stretch', sm: 'center' }}
            >
              {showReset && (
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  disabled={disabled || loading || isSubmitting}
                  size={'medium'}
                  sx={{ order: { xs: 2, sm: 1 } }}
                >
                  {resetText}
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={disabled || loading || isSubmitting}
                size={'medium'}
                sx={{ 
                  order: { xs: 1, sm: 2 },
                  py: 1.2,
                  px: 3,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(244, 124, 36, 0.25)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(244, 124, 36, 0.35)',
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    boxShadow: 'none',
                    transform: 'none'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {isSubmitting ? 'Submitting...' : submitText}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Fade in timeout={300}>
      {paper ? <Paper sx={{ overflow: 'hidden' }}>{content}</Paper> : <Box>{content}</Box>}
    </Fade>
  );
};

export default EnhancedForm;
