import { StyleSheet } from 'react-native';
import { theme } from '@ui/styles/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
