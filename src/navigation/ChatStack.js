import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChatDetailScreen from '../screens/chat/ChatDetailScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';

const Stack = createNativeStackNavigator();

export default function ChatStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
