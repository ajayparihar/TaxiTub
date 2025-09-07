# TaxiTub Design System

This document captures the tokens, components, and UI/UX rules for building consistent features across TaxiTub. It complements MICROCOPY_GUIDE.md.

1) Foundations (Design Tokens)
- Color
  - Primary: #F47C24 (hover #E16E1C)
  - Success: #4CAF50, Error: #F44336, Warning: #FB8C00, Info: #1E88E5
  - Light mode
    - background.default: #FAF9F6, background.paper: #FFFFFF, divider: #EAEAEA
    - text.primary: #333333, text.secondary: #666666
  - Dark mode
    - background.default: #121212, background.paper: #1E1E1E, divider: #2F2F2F
    - text.primary: #EDEDED, text.secondary: #B0B0B0

- Spacing (8px scale)
  - xs 4, sm 8, md 16, lg 24, xl 32, xxl 48

- Radius
  - sm 8, md 12, lg 16, xl 24

- Shadows
  - card: 0 2px 8px rgba(17,24,39,.06)
  - cardHover: 0 6px 16px rgba(17,24,39,.08)
  - button: 0 2px 8px rgba(244,124,36,.20)
  - focus: theme-based 3px ring

- Typography
  - Roboto; headings weight 700; body regular; buttons semi-bold; sentence case everywhere.

2) Components
- Buttons (contained/outlined/text)
  - No uppercase; medium/large sizes; visible focus ring; disabled uses action.disabledBackground
- Inputs (TextField/Select/Autocomplete)
  - background.paper; border divider; focus border primary; helper text concise; placeholder in text.secondary
- Cards/Paper
  - background.paper; 1px divider border; card shadow on hover
- Tables
  - Header background.background.paper; 600 weight headers; rows hover action.hover
- Chips/Badges
  - Use theme palettes; avoid hardcoded white/grey; prefer color="primary|success|error|warning|info"; in dark mode text uses contrastText
- Snackbar/Toast
  - Provided by ToastProvider; use useNotification() convenience hooks; keep microcopy short

3) Layout
- AppBar background.paper with subtle bottom border; Drawer on mobile
- BaseLayout uses Container with responsive padding; avoid full-bleed content unless necessary

4) Interaction & Motion
- Use MUI Fade/Grow for small reveals; respect prefers-reduced-motion
- Loading states: skeletons for large blocks; spinners for inline

5) Accessibility
- All icon-only buttons must have aria-label
- Ensure focus-visible ring on interactive components
- Maintain color contrast ≥ 4.5:1 for text, ≥ 3:1 for large text or UI states
- Do not rely on color alone to convey meaning; use icons/labels

6) Dark mode
- Use ThemeModeProvider; never hardcode 'white' or 'grey.x' in sx
- Prefer background.paper, text.primary/secondary, divider, action.hover/disabled

7) Patterns & Examples
- Queue list: order by position ascending; show normalized positions (1..N)
- Forms: visible labels; placeholders show examples; validation messages are actionable

8) Implementation Notes
- Theme source: src/theme.ts (getTheme with light/dark tokens)
- Theme toggle: components/Navigation.tsx (uses useThemeMode)
- Notification: components/NotificationProvider.tsx (adapter to Toast)

Following these rules ensures the app stays consistent, accessible, and easy to extend.

