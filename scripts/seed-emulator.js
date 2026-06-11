/**
 * Emulator'a tum koleksiyonlari yazar: npm run seed
 * Emulator calisiyor olmali: npm run emulators
 */
const { readFileSync } = require('fs');
const { join } = require('path');
const { initializeApp } = require('firebase/app');
const {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} = require('firebase/auth');
const {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} = require('firebase/firestore');

// .env'den project id oku
function loadProjectId() {
  try {
    const env = readFileSync(join(__dirname, '../.env'), 'utf8');
    const match = env.match(/EXPO_PUBLIC_FIREBASE_PROJECT_ID=(.+)/);
    if (match) return match[1].trim();
  } catch {
    // fallback
  }
  return 'campusconnect-9758a';
}

const PROJECT_ID = loadProjectId();
const DEMO_EMAIL = 'demo@campus.edu';
const DEMO_PASS = 'demo123456';
const HOST = '127.0.0.1';

const app = initializeApp({ apiKey: 'demo', projectId: PROJECT_ID });
const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, `http://${HOST}:9099`, { disableWarnings: true });
connectFirestoreEmulator(db, HOST, 8080);

async function ensureUser() {
  try {
    await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASS);
  } catch {
    await createUserWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASS);
  }
  const user = auth.currentUser;
  await setDoc(
    doc(db, 'users', user.uid),
    {
      uid: user.uid,
      displayName: 'Demo Ogrenci',
      email: DEMO_EMAIL,
      department: 'Bilgisayar Muhendisligi',
      year: 3,
      bio: 'CampusConnect demo',
      interests: ['React', 'Firebase'],
      followersCount: 0,
      followingCount: 0,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
  return user;
}

async function seedCollection(name, items, buildDoc) {
  const ref = collection(db, name);
  const existing = await getDocs(ref);
  if (existing.size > 0) {
    console.log(`  ${name}: zaten ${existing.size} kayit (atlandi)`);
    return existing.size;
  }
  for (const item of items) {
    await buildDoc(ref, item);
  }
  const count = (await getDocs(ref)).size;
  console.log(`  ${name}: ${count} kayit eklendi`);
  return count;
}

async function main() {
  console.log(`Proje: ${PROJECT_ID} | Host: ${HOST}:8080\n`);

  const user = await ensureUser();
  console.log('Demo kullanici hazir:', DEMO_EMAIL);

  await seedCollection(
    'events',
    [
      { title: 'Kampus Guz Festivali', category: 'Konser', location: 'Ana Meydan', description: 'Canli muzik, yemek standlari ve sahne gosterileri ile unutulmaz bir gece.', cover: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80', cap: 1200, att: 340 },
      { title: 'Yapay Zeka ve Gelecek Zirvesi', category: 'Seminer', location: 'Muhendislik Fak. Konferans Salonu', description: 'Sektor liderleriyle derin ogrenme, veri bilimi ve otomasyonun gelecegi.', cover: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80', cap: 200, att: 124 },
      { title: 'Fakulteler Arasi Turnuva', category: 'Spor', location: 'Spor Salonu', description: 'Basketbol ve voleybol musabakalari.', cover: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80', cap: 300, att: 128 },
      { title: 'Python Atolyesi: Baslangic', category: 'Akademik', location: 'Teknokent', description: 'Sifirdan Python ogren, mini projeler gelistir.', cover: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80', cap: 60, att: 42 },
      { title: 'Kariyer Networking Gecesi', category: 'Sosyal', location: 'Ogrenci Merkezi', description: 'Mezunlarla tanis, baglanti kur.', cover: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80', cap: 150, att: 88 },
    ],
    async (ref, event) => {
      const now = Date.now();
      await addDoc(ref, {
        title: event.title,
        category: event.category,
        location: event.location,
        description: event.description,
        organizerId: user.uid,
        organizer: { displayName: 'Demo Ogrenci', photoURL: '' },
        capacity: event.cap,
        isOnline: false,
        tags: ['kampus', event.category.toLowerCase()],
        coverURL: event.cover,
        attendeeCount: 0,
        likeCount: 0,
        status: 'active',
        startDate: Timestamp.fromDate(new Date(now + 86400000)),
        endDate: Timestamp.fromDate(new Date(now + 90000000)),
        createdAt: serverTimestamp(),
      });
    },
  );

  await seedCollection(
    'communities',
    [
      { name: 'Yazilim Gelistiriciler', category: 'Teknoloji', description: 'Kampusun en buyuk yazilim toplulugu. Hackathonlar, atolyeler ve projeler.', cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', members: 1240 },
      { name: 'Modern Sanat Atolyesi', category: 'Sanat', description: 'Resim, heykel ve dijital sanat uzerine haftalik bulusmalar.', cover: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80', members: 856 },
    ],
    async (ref, c) => {
      const docRef = await addDoc(ref, {
        name: c.name,
        category: c.category,
        description: c.description,
        coverURL: c.cover,
        creatorId: user.uid,
        memberCount: 0,
        postCount: 0,
        iconURL: '',
        tags: [c.category],
        rules: ['Saygili olun', 'Spam yapmayin'],
        isPrivate: false,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'communities', docRef.id, 'members', user.uid), {
        joinedAt: serverTimestamp(),
        role: 'admin',
      });
      await addDoc(collection(db, 'communities', docRef.id, 'posts'), {
        userId: user.uid,
        displayName: 'Demo Ogrenci',
        photoURL: '',
        content: `${c.name} topluluguna hos geldiniz!`,
        imageURLs: [],
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
      });
    },
  );

  await seedCollection(
    'listings',
    [
      { title: 'Psikolojiye Giris Kitabi', category: 'Kitap', price: 250, condition: 'new', description: 'CS 101 ders kitaplari, hic kullanilmadi.', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80' },
      { title: 'Logitech G Pro Mouse', category: 'Elektronik', price: 1200, condition: 'like-new', description: 'Kablosuz oyuncu mouse, kutusunda.', img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80' },
      { title: 'Paslanmaz Matara', category: 'Diger', price: 150, condition: 'good', description: '1L termos matara.', img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80' },
      { title: 'Nike Kosu Ayakkabisi', category: 'Giyim', price: 850, condition: 'like-new', description: '42 numara, az giyildi.', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' },
      { title: 'MacBook Air M2 13"', category: 'Elektronik', price: 28500, condition: 'like-new', description: 'Bir donem kullanildi, kusursuz durumda.', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80' },
    ],
    async (ref, l) => {
      await addDoc(ref, {
        title: l.title,
        category: l.category,
        price: l.price,
        condition: l.condition,
        description: l.description,
        currency: 'TRY',
        sellerId: user.uid,
        seller: { displayName: 'Demo Ogrenci', photoURL: '', department: 'Bilgisayar Muhendisligi' },
        imageURL: l.img,
        imageURLs: [l.img],
        viewCount: 0,
        savedCount: 0,
        status: 'active',
        tags: [l.category.toLowerCase()],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
  );

  // Dogrulama
  const collections = ['events', 'communities', 'listings', 'users'];
  console.log('\n--- Dogrulama ---');
  for (const name of collections) {
    const snap = await getDocs(collection(db, name));
    console.log(`${name}: ${snap.size} dokuman`);
  }

  console.log('\nEmulator UI: http://127.0.0.1:4000/firestore');
  console.log('Proje:', PROJECT_ID, '| F5 ile yenile');
  console.log('Giris:', DEMO_EMAIL, '/', DEMO_PASS);
}

main().catch((e) => {
  console.error('\nHATA:', e.message);
  console.error('Once emulator baslat: npm run emulators');
  process.exit(1);
});
