import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@ui/components/AppText';
import { Button } from '@ui/components/Button';
import { SocialSignInButtons } from '@ui/components/SocialSignInButtons';
import { styles } from '@ui/screens/Greetings/styles';
import { useGreetingsController } from '@ui/screens/Greetings/useGreetingsController';

export function Greetings() {
  const { goToSignUp, goToSignIn } = useGreetingsController();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <AppText size="xl" weight="bold">Bem-vindo</AppText>
        <AppText color="muted">Entre ou crie sua conta para continuar.</AppText>
      </View>
      <View style={styles.actions}>
        <Button onPress={goToSignUp}>Criar conta</Button>
        <Button variant="outline" onPress={goToSignIn}>Já tenho conta</Button>
      </View>
      <SocialSignInButtons />
    </SafeAreaView>
  );
}
