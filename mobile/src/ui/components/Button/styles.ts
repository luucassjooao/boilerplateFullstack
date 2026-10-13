import { StyleSheet } from 'react-native';
import { theme } from '@ui/styles/theme';
import { createVariants } from '@ui/styles/utils/createVariants';

export const buttonStyles = createVariants({
  base: {
    height: 48,
    borderRadius: theme.radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  variants: {
    variant: {
      primary: { backgroundColor: theme.colors.primary },
      outline: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
      ghost: { backgroundColor: 'transparent' },
    },
  },
  defaultVariants: { variant: 'primary' },
});

export const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
