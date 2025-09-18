import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, firestore } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const allowedSnap = await getDoc(doc(firestore, 'allowedUsers', firebaseUser.uid));
          if (!allowedSnap.exists()) {
            // Usar setTimeout para evitar problemas de renderizado
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.alert('Acceso restringido. Contacta al administrador.');
              }
            }, 100);
            await signOut(auth);
            setUser(null);
          }
        } catch (err) {
          // Si no podemos leer allowedUsers (por reglas), negar acceso por seguridad
          console.error('Error verificando allowedUsers:', err);
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.alert('Acceso restringido. Contacta al administrador.');
            }
          }, 100);
          await signOut(auth);
          setUser(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async signInWithEmail(email: string, password: string) {
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signUpWithEmail(email: string, password: string) {
      await createUserWithEmailAndPassword(auth, email, password);
    },
    async signInWithGoogle() {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    },
    async logout() {
      await signOut(auth);
    }
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


