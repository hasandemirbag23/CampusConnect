import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CreateEventScreen from '../screens/discover/CreateEventScreen';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import EventDetailScreen from '../screens/discover/EventDetailScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';

const Stack = createNativeStackNavigator();

export default function DiscoverStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Discover" component={DiscoverScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Etkinlik Detay' }} />
      <Stack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profil' }} />
    </Stack.Navigator>
  );
}
