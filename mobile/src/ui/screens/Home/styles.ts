import { StyleSheet } from 'react-native';
import { theme } from '@ui/styles/theme';

export const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    borderRadius: theme.radius,
    backgroundColor: theme.colors.surface,
  },
});
