import type { ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from '@ui/components/AppText';
import { styles } from '@ui/components/FormGroup/styles';

type Props = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function FormGroup({ label, error, children }: Props) {
  return (
    <View style={styles.container}>
      <AppText size="sm" weight="medium">{label}</AppText>
      {children}
      {error && <AppText size="sm" color="destructive" accessibilityRole="alert">{error}</AppText>}
    </View>
  );
}
