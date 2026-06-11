import { logEvent } from 'firebase/analytics';

import { getAnalyticsInstance } from './firebase';

export async function trackEvent(name, params = {}) {
  try {
    const analytics = await getAnalyticsInstance();
    if (analytics) {
      logEvent(analytics, name, params);
    }
  } catch {
    // Analytics native'de desteklenmeyebilir
  }
}
