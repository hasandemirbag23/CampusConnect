import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CreateListingScreen from '../screens/market/CreateListingScreen';
import ListingDetailScreen from '../screens/market/ListingDetailScreen';
import MarketHomeScreen from '../screens/market/MarketHomeScreen';
import MyListingsScreen from '../screens/market/MyListingsScreen';

const Stack = createNativeStackNavigator();

export default function MarketStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MarketHome" component={MarketHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'Ilan Detay' }} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ presentation: 'modal', title: 'Ilan Olustur' }} />
      <Stack.Screen name="MyListings" component={MyListingsScreen} options={{ title: 'Ilanlarim' }} />
    </Stack.Navigator>
  );
}
