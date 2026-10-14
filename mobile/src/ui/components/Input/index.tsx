import { TextInput, type TextInputProps } from 'react-native';
import { styles } from '@ui/components/Input/styles';
import { theme } from '@ui/styles/theme';

type Props = TextInputProps & { invalid?: boolean };

export function Input({ invalid, style, ...props }: Props) {
  return (
    <TextInput
      placeholderTextColor={theme.colors.muted}
      style={[styles.input, invalid && styles.invalid, style]}
      {...props}
    />
  );
}
