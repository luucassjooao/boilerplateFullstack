import { NavigationContainer } from '@react-navigation/native';
import { RootStack } from '@app/navigation/RootStack';

export function Navigation() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}
