import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import { AppText } from '@ui/components/AppText';
import { buttonStyles, styles } from '@ui/components/Button/styles';
import { theme } from '@ui/styles/theme';

type Props = Omit<PressableProps, 'children'> & {
  children: string;
  variant?: 'primary' | 'outline' | 'ghost';
  isLoading?: boolean;
};

export function Button({ children, variant = 'primary', isLoading, disabled, style, ...props }: Props) {
  const isDisabled = disabled || isLoading;
  const textColor = variant === 'primary' ? 'primaryForeground' : 'foreground';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!isLoading }}
      disabled={isDisabled}
      style={(state) => [
        buttonStyles({ variant }),
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {isLoading
        ? <ActivityIndicator color={variant === 'primary' ? theme.colors.primaryForeground : theme.colors.foreground} />
        : <AppText weight="medium" color={textColor}>{children}</AppText>}
    </Pressable>
  );
}
