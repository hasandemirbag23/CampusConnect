import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CommunityDetailScreen from '../screens/community/CommunityDetailScreen';
import CommunityListScreen from '../screens/community/CommunityListScreen';
import CreateCommunityScreen from '../screens/community/CreateCommunityScreen';
import PostDetailScreen from '../screens/community/PostDetailScreen';
import EventDetailScreen from '../screens/discover/EventDetailScreen';

const Stack = createNativeStackNavigator();

export default function CommunityStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="CommunityList" component={CommunityListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} options={{ title: 'Topluluk' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Gonderi' }} />
      <Stack.Screen name="CreateCommunity" component={CreateCommunityScreen} options={{ presentation: 'modal', title: 'Topluluk Olustur' }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Etkinlik Detay' }} />
    </Stack.Navigator>
  );
}
