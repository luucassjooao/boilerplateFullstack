/** Neutral placeholder theme: the project defines its own visual identity later. */
export const theme = {
  colors: {
    background: '#ffffff',
    foreground: '#171717',
    muted: '#737373',
    surface: '#f5f5f5',
    border: '#e5e5e5',
    primary: '#171717',
    primaryForeground: '#fafafa',
    destructive: '#dc2626',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: 10,
  fontSizes: {
    sm: 13,
    md: 15,
    lg: 18,
    xl: 26,
  },
} as const;
