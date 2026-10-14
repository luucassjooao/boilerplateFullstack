import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@app/navigation/types';
import { Home } from '@ui/screens/Home';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={Home} options={{ title: 'Início' }} />
    </Stack.Navigator>
  );
}
