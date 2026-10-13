import { theme } from '@ui/styles/theme';
import { createVariants } from '@ui/styles/utils/createVariants';

export const appTextStyles = createVariants({
  variants: {
    size: {
      sm: { fontSize: theme.fontSizes.sm },
      md: { fontSize: theme.fontSizes.md },
      lg: { fontSize: theme.fontSizes.lg },
      xl: { fontSize: theme.fontSizes.xl },
    },
    weight: {
      regular: { fontWeight: '400' },
      medium: { fontWeight: '500' },
      bold: { fontWeight: '700' },
    },
    color: {
      foreground: { color: theme.colors.foreground },
      muted: { color: theme.colors.muted },
      destructive: { color: theme.colors.destructive },
      primaryForeground: { color: theme.colors.primaryForeground },
    },
  },
  defaultVariants: { size: 'md', weight: 'regular', color: 'foreground' },
});
