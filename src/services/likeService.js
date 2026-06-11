import { httpsCallable } from 'firebase/functions';

import { functions } from './firebase';

export async function toggleEventLike(eventId, liked) {
  const fn = httpsCallable(functions, 'toggleEventLike');
  await fn({ eventId, liked });
}

export async function togglePostLike(communityId, postId, liked) {
  const fn = httpsCallable(functions, 'onPostLike');
  await fn({ communityId, postId, liked });
}

export async function recordListingView(listingId) {
  const fn = httpsCallable(functions, 'onListingView');
  await fn({ listingId });
}
