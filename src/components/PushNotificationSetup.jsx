import { useEffect } from 'react';

import { useAuth } from '../context/AuthContext';
import { registerForPushNotifications } from '../services/notificationService';

export default function PushNotificationSetup() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      registerForPushNotifications(user.uid).catch(() => {});
    }
  }, [user?.uid]);

  return null;
}
