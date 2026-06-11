import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { saveFcmToken } from './authService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(userId) {
  if (!userId || Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;
  await saveFcmToken(userId, token);
  return token;
}

export async function deleteToken(userId) {
  if (!userId) return;
  await saveFcmToken(userId, '');
}
