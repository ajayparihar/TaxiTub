# TaxiTub Theme Documentation

## 🎨 New Color Palette Overview

The TaxiTub application now uses a professional, modern color system based on the **"Consumed by Fire"** primary palette and **"Bluebonnet"** accent palette. This creates a warm, inviting interface that maintains professional credibility.

## 📊 Color System

### Primary Colors - "Consumed by Fire" 🔥
Warm orange tones that convey energy, enthusiasm, and reliability.

```css
--primary-100: #FFFBF2  /* Lightest - subtle backgrounds */
--primary-200: #FFE8BD  /* Light - hover states */
--primary-300: #FECF88  /* Medium light - secondary actions */
--primary-400: #FBAD52  /* Medium - active states */
--primary-500: #F5851D  /* Main brand color - primary buttons */
--primary-600: #C1580A  /* Medium dark - pressed states */
--primary-700: #8E3502  /* Dark - text on light backgrounds */
--primary-800: #5A1C00  /* Darker - high contrast text */
--primary-900: #260A00  /* Darkest - maximum contrast */
```

### Accent Colors - "Bluebonnet" 💙
Professional blue-purple tones for highlights and secondary actions.

```css
--accent-100: #F5F2FF  /* Lightest - subtle accent backgrounds */
--accent-200: #C8BEFF  /* Light - hover states */
--accent-300: #9488FC  /* Medium light - secondary actions */
--accent-400: #5952F4  /* Medium - active states */
--accent-500: #1E21E6  /* Main accent - key highlights */
--accent-600: #0A17B6  /* Medium dark - pressed states */
--accent-700: #021486  /* Dark - accent text */
--accent-800: #001156  /* Darker - high contrast */
--accent-900: #000A26  /* Darkest - maximum contrast */
```

### Neutral Colors 🌫️
Sophisticated grayscale palette for backgrounds and text hierarchy.

```css
--neutral-100: #FCFCFA  /* Lightest - primary text on dark */
--neutral-200: #EFEEEA  /* Very light - secondary text */
--neutral-300: #E2DFDB  /* Light - tertiary text */
--neutral-400: #D4D1CC  /* Medium light - placeholders */
--neutral-500: #C7C2BD  /* Medium - disabled text */
--neutral-600: #9F9995  /* Medium dark - borders */
--neutral-700: #77716E  /* Dark - containers */
--neutral-800: #4E4A48  /* Darker - card backgrounds */
--neutral-900: #262322  /* Darkest - main background */
```

## 🏗️ Modular Architecture

### CSS Custom Properties
All theme colors are available as CSS custom properties in `:root` for maximum flexibility:

```css
/* Usage in custom CSS */
.my-component {
  background-color: var(--primary-500);
  color: var(--neutral-100);
  border: 1px solid var(--accent-300);
}
```

### Material-UI Theme Integration
The theme seamlessly integrates with Material-UI components while maintaining the custom color palette:

```typescript
import { theme } from './theme';
import { ThemeProvider } from '@mui/material/styles';

// Theme automatically applies to all MUI components
<ThemeProvider theme={theme}>
  <YourApp />
</ThemeProvider>
```

## 🎯 Design Tokens

### Spacing System (8px Base)
```css
--spacing-xs: 4px   /* 0.5 units */
--spacing-sm: 8px   /* 1 unit */
--spacing-md: 16px  /* 2 units */
--spacing-lg: 24px  /* 3 units */
--spacing-xl: 32px  /* 4 units */
--spacing-xxl: 48px /* 6 units */
```

### Border Radius Scale
```css
--radius-xs: 4px   /* Small elements */
--radius-sm: 8px   /* Cards, inputs */
--radius-md: 12px  /* Containers */
--radius-lg: 16px  /* Large surfaces */
--radius-xl: 24px  /* Hero sections */
```

### Shadow System
```css
--shadow-glass: 0 8px 24px rgba(38, 35, 34, 0.5)
--shadow-hover: 0 12px 32px rgba(38, 35, 34, 0.6)
--shadow-elevated: 0 16px 40px rgba(38, 35, 34, 0.7)
```

## 📱 Responsive Breakpoints

The theme includes comprehensive responsive utilities:

```css
--breakpoint-sm: 600px   /* Tablets */
--breakpoint-md: 960px   /* Small desktops */
--breakpoint-lg: 1280px  /* Large desktops */
--breakpoint-xl: 1920px  /* Extra large screens */
```

## 🎨 Soft Flat Design System

### Principles
All surfaces follow a soft-flat aesthetic:
- No backdrop blur; avoid transparency on core surfaces
- Solid backgrounds with a subtle 1px border for separation
- Minimal or no shadows; rely on color and spacing for depth
- Smooth, consistent transitions at 200ms ease-in-out
- Standardized radii: 12px for containers, 8px for controls

### Component Examples

#### Cards
```typescript
// Soft-flat surface with solid background and subtle border
<Card>
  <CardContent>
    Your content here
  </CardContent>
</Card>
```

#### Forms
```typescript
// Soft-flat inputs with clear focus ring and no blur
<TextField
  label="Enter your name"
  variant="outlined"
  fullWidth
/>
```

## 🛠️ Utility Classes

### Color Utilities
```css
.text-primary { color: var(--primary-500); }
.text-accent { color: var(--accent-500); }
.bg-primary { background-color: var(--primary-500); }
.bg-neutral-dark { background-color: var(--neutral-800); }
```

### Responsive Display
```css
.hidden-mobile    /* Hide on mobile */
.visible-tablet   /* Show only on tablet */
.hidden-desktop   /* Hide on desktop */
```

### Animation Classes
```css
.animate-fade-in     /* Smooth fade in */
.animate-slide-up    /* Slide up animation */
.animate-bounce-in   /* Bounce entrance */
```

## ♿ Accessibility Features

### High Contrast Support
- All color combinations meet WCAG AA standards
- Focus states use accent colors for clear visibility
- Reduced motion support for accessibility preferences

### Keyboard Navigation
- Clear focus rings using accent colors
- Logical tab order maintained
- Screen reader friendly color descriptions

## 🚀 Usage Examples

### Creating Professional Cards
```typescript
<Card className="glass-surface p-lg rounded-lg">
  <Typography variant="h6" className="text-primary">
    Taxi Status
  </Typography>
  <Typography variant="body2" className="text-neutral">
    Currently in queue
  </Typography>
</Card>
```

### Custom Components with Theme Colors
```typescript
const StyledButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  boxShadow: theme.designTokens?.shadows?.primary,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.designTokens?.shadows?.hover,
  },
}));
```

### Responsive Layout
```css
.dashboard-grid {
  display: grid;
  gap: var(--spacing-lg);
  grid-template-columns: 1fr;
}

@media (min-width: 960px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1280px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## 🔄 Migration from Old Theme

### Key Changes
1. **Primary color**: Blue → Orange (Consumed by Fire)
2. **Accent color**: Magenta → Blue-Purple (Bluebonnet)
3. **Enhanced glassmorphism**: Improved blur and transparency
4. **Better responsive utilities**: More comprehensive breakpoint system
5. **Improved accessibility**: Better contrast ratios and focus states

### Breaking Changes
- Some color names have changed in the theme object
- Shadow values have been updated
- Component default styles may look different

### Recommendations
- Use CSS custom properties for maximum flexibility
- Leverage utility classes for rapid development
- Test all components in different screen sizes
- Verify accessibility with screen readers

## 🎭 Theme Customization

### Creating Custom Variants
```typescript
// Extend the theme with custom variants
declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
  }
  
  interface PaletteOptions {
    tertiary: PaletteOptions['primary'];
  }
}
```

### Environment-Specific Themes
```typescript
// Development theme with additional debugging
const devTheme = createTheme({
  ...theme,
  components: {
    ...theme.components,
    MuiCard: {
      ...theme.components?.MuiCard,
      styleOverrides: {
        ...theme.components?.MuiCard?.styleOverrides,
        root: {
          ...theme.components?.MuiCard?.styleOverrides?.root,
          border: '2px solid red', // Debug border
        },
      },
    },
  },
});
```

## 📈 Performance Considerations

- CSS custom properties enable efficient theming without JavaScript
- Reduced bundle size by using system fonts as fallbacks
- Optimized shadow and blur values for smooth animations
- Minimal re-renders with stable theme object structure

---

**Theme Version**: v2.0.0  
**Last Updated**: December 2024  
**Compatibility**: React 18+, Material-UI 5.15+, Modern Browsers

For questions or contributions, please refer to the development team.
