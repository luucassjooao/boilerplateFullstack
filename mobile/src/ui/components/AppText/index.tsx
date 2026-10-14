import { Text, type TextProps } from 'react-native';
import { appTextStyles } from '@ui/components/AppText/styles';

type Props = TextProps & NonNullable<Parameters<typeof appTextStyles>[0]>;

export function AppText({ size, weight, color, style, ...props }: Props) {
  return <Text style={[appTextStyles({ size, weight, color }), style]} {...props} />;
}
