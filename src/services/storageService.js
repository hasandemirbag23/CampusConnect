import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { storage } from './firebase';

export function uploadFile(path, file, onProgress) {
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress = snapshot.bytesTransferred / snapshot.totalBytes;
          onProgress(progress);
        }
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      },
    );
  });
}

export async function uploadEventCover(eventId, uri, onProgress) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return uploadFile(`events/${eventId}/cover.jpg`, blob, onProgress);
}

export async function uploadListingImages(listingId, uris, onProgress) {
  const uploads = uris.slice(0, 5).map(async (uri, index) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return uploadFile(`listings/${listingId}/${index}.jpg`, blob, (p) => {
      if (onProgress) onProgress((index + p) / uris.length);
    });
  });
  return Promise.all(uploads);
}

export async function uploadProfilePhoto(uid, uri, onProgress) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return uploadFile(`avatars/${uid}/avatar.jpg`, blob, onProgress);
}

export async function uploadPostImage(communityId, uri, onProgress) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return uploadFile(`posts/${communityId}/${Date.now()}.jpg`, blob, onProgress);
}

export async function uploadChatImage(chatId, uri, onProgress) {
  const response = await fetch(uri);
  const blob = await response.blob();
  return uploadFile(`chats/${chatId}/${Date.now()}.jpg`, blob, onProgress);
}
