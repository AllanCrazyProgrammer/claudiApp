import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Configuración provista por Firebase Console (App Web)
const firebaseConfig = {
  apiKey: 'AIzaSyDlWE7XS9WYJpwKnxmfcSnt9l8HCtaRI4Q',
  authDomain: 'claudiapp-36ec9.firebaseapp.com',
  projectId: 'claudiapp-36ec9',
  storageBucket: 'claudiapp-36ec9.firebasestorage.app',
  messagingSenderId: '843935164890',
  appId: '1:843935164890:web:46efd82ecec9a6df1678e3',
  measurementId: 'G-B9CCJS7GJ9'
};

const app = initializeApp(firebaseConfig);

export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);

// Inicializar Analytics en navegador
export const analytics = (() => {
  try {
    if (typeof window !== 'undefined') {
      return getAnalytics(app);
    }
  } catch (_) {
    // Ignorar errores de entorno no soportado
  }
  return undefined as unknown as ReturnType<typeof getAnalytics>;
})();


