import { ActivityIndicator, View } from 'react-native';
import { AppText } from '@ui/components/AppText';
import { Button } from '@ui/components/Button';
import { Screen } from '@ui/components/Screen';
import { styles } from '@ui/screens/Home/styles';
import { useHomeController } from '@ui/screens/Home/useHomeController';

export function Home() {
  const { me, isLoading, signOut } = useHomeController();

  return (
    <Screen>
      {isLoading || !me ? <ActivityIndicator /> : (
        <View style={styles.card}>
          <AppText size="lg" weight="bold">Olá, {me.name}!</AppText>
          <AppText color="muted">{me.email}</AppText>
          <AppText size="sm">Email confirmado: {me.emailVerified ? 'sim' : 'não'}</AppText>
          <AppText size="sm">
            Login social: {me.providers.length > 0 ? me.providers.join(', ') : 'nenhum'}
          </AppText>
        </View>
      )}
      <Button variant="outline" onPress={() => void signOut()}>Sair</Button>
    </Screen>
  );
}
