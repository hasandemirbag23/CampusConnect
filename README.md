# CampusConnect (CODE23)

Expo SDK 54 · React Native · Firebase (Auth, Firestore, Functions, Storage) · Expo Go uyumlu

## Hizli Baslangic

```bash
npm install
cp .env.example .env          # EXPO_PUBLIC_USE_EMULATOR=true
npm run emulators               # Terminal 1
npm run seed                    # Terminal 2 (bir kez)
npx expo start --clear          # Web veya dev client
npm run android                 # Android emulator (dev build)
```

**Demo:** `demo@campus.edu` / `demo123456` · Emulator UI: http://127.0.0.1:4000

## Veri Modeli (Ozet)

- **users** → follows, notifications, savedEvents, savedListings
- **events** → attendees, comments, likes (attendeeCount, likeCount)
- **communities** → members, posts → comments, likes
- **listings** → sellerId, status, viewCount
- **chats** → participants, messages, unreadCount

## Cloud Functions (Ozet)

Counter: `onEventJoin`, `onCommunityJoin`, `onPostCreate`, `onCommentCreate`, `onUserFollow`  
Callable: `toggleEventLike`, `onPostLike` · Mesaj: `onMessageSent` · Zamanli: `sendEventReminder`

Deploy: `firebase deploy --only functions,firestore:rules`

## Test Senaryolari (Ozet)

| Modul | Aksiyon | Beklenen |
|-------|---------|----------|
| Discover | Etkinlik olustur / katil | onSnapshot + attendeeCount |
| Community | Post paylas / begen | Uyeler anlik gorur |
| Market | Ilan olustur / satildi | Market listesi guncellenir |
| Chat | Mesaj gonder | Real-time + push bildirim |
| Auth | Cikis yap | FCM token silinir |

**2 cihaz:** Ayni Wi-Fi, `EXPO_PUBLIC_EMULATOR_HOST` = bilgisayar IP.

## Android Emulator

`adb reverse` (8081, 8080, 9099) sonra `npm run android`. AVD host: `10.0.2.2`

## UI / Animasyon

Reanimated: skeleton shimmer, hero fade-in, form adim gecisi, tab badge, like animasyonu.

## Proje Yapisi

`src/` context · services · screens · components · `functions/` · `scripts/seed-emulator.js`

## Discover
- EventContext onSnapshot listener
- Firestore pagination ve arama

## Market
- Listing CRUD ve Firestore pagination
- Fiyat filtresi ve tags alani

- [x] feature/firebase-foundation

- [x] feature/auth-core

- [x] feature/auth-google

- [x] feature/theme-navigation

- [x] feature/discover-events

- [x] feature/event-detail

- [x] feature/create-event

- [x] feature/community-posts

- [x] feature/market-listings

- [x] feature/listing-create

- [x] feature/profile-settings

- [x] feature/chat-realtime
