import { StyleSheet } from 'react-native';
import { theme } from '@ui/styles/theme';

export const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.background,
  },
  invalid: {
    borderColor: theme.colors.destructive,
  },
});
