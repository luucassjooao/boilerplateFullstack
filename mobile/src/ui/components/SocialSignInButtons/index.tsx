import * as AppleAuthentication from 'expo-apple-authentication';
import { View } from 'react-native';
import { useSocialSignIn } from '@app/hooks/app/useSocialSignIn';
import { Button } from '@ui/components/Button';
import { styles } from '@ui/components/SocialSignInButtons/styles';
import { theme } from '@ui/styles/theme';

export function SocialSignInButtons() {
  const { signInWith, isLoading, isAppleAvailable } = useSocialSignIn();

  return (
    <View style={styles.container}>
      <Button variant="outline" isLoading={isLoading} onPress={() => signInWith('google')}>
        Continuar com Google
      </Button>
      {isAppleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={theme.radius}
          style={styles.apple}
          onPress={() => signInWith('apple')}
        />
      )}
    </View>
  );
}
