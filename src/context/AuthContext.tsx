/**
 * Auth Context
 * Manages Firebase authentication state and provides auth methods
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  linkWithPopup,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  getFirebaseAuth,
  getFirebaseDb,
  getGoogleProvider,
  isFirebaseConfigured,
} from '../services/firebase';
import type { ReviewUser } from '../types';
import { createLogger } from '@guinetik/logger';

const logger = createLogger({ prefix: 'AuthContext' });

interface AuthContextValue {
  /** Firebase user object (null if not authenticated) */
  user: User | null;
  /** User profile from Firestore (null if not loaded) */
  profile: ReviewUser | null;
  /** Loading state during auth initialization */
  loading: boolean;
  /** Whether Firebase is configured */
  isConfigured: boolean;
  /** Sign in with Google (creates/links account) */
  signInWithGoogle: () => Promise<void>;
  /** Sign in anonymously */
  signInAnonymously: (displayName: string) => Promise<void>;
  /** Sign out */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Generate a DiceBear avatar URL
 */
function generateAvatar(uid: string): string {
  return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${uid}`;
}

/**
 * Create or update user profile in Firestore
 */
async function upsertUserProfile(
  user: User,
  authProvider: 'google' | 'anonymous',
  displayName?: string
): Promise<ReviewUser> {
  const db = getFirebaseDb();
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    // User exists, return existing profile
    return userDoc.data() as ReviewUser;
  }

  // Create new user profile
  const profile: ReviewUser = {
    uid: user.uid,
    authProvider,
    name: displayName || user.displayName || 'Space Traveler',
    email: user.email || '',
    avatar: user.photoURL || generateAvatar(user.uid),
  };

  await setDoc(userRef, profile);
  logger.info('Created user profile:', profile.uid);

  return profile;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ReviewUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isFirebaseConfigured();

  // Listen to auth state changes
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Check if we already have a profile for this user (set by signIn methods)
        // This avoids race conditions where Firestore doc isn't created yet
        setProfile((currentProfile) => {
          if (currentProfile && currentProfile.uid === firebaseUser.uid) {
            // Already have profile for this user, keep it
            setLoading(false);
            return currentProfile;
          }
          // Need to fetch profile from Firestore
          fetchProfile(firebaseUser.uid);
          return currentProfile;
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isConfigured]);

  // Fetch profile from Firestore (called by onAuthStateChanged when needed)
  const fetchProfile = async (uid: string) => {
    try {
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        setProfile(userDoc.data() as ReviewUser);
      }
    } catch (err) {
      logger.error('Failed to fetch user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = useCallback(async () => {
    if (!isConfigured) {
      throw new Error('Firebase is not configured');
    }

    const auth = getFirebaseAuth();
    const provider = getGoogleProvider();

    try {
      // If already signed in anonymously, link with Google
      if (auth.currentUser?.isAnonymous) {
        logger.info('Linking anonymous account with Google');
        const result = await linkWithPopup(auth.currentUser, provider);
        const newProfile = await upsertUserProfile(result.user, 'google');
        setProfile(newProfile);
      } else {
        // Fresh Google sign-in
        const result = await signInWithPopup(auth, provider);
        const newProfile = await upsertUserProfile(result.user, 'google');
        setProfile(newProfile);
      }
    } catch (err: unknown) {
      // Handle case where Google account is already linked to another user
      if (err && typeof err === 'object' && 'code' in err && err.code === 'auth/credential-already-in-use') {
        logger.warn('Google account already in use, signing in directly');
        const result = await signInWithPopup(auth, provider);
        const newProfile = await upsertUserProfile(result.user, 'google');
        setProfile(newProfile);
      } else {
        throw err;
      }
    }
  }, [isConfigured]);

  const signInAnonymously = useCallback(
    async (displayName: string) => {
      if (!isConfigured) {
        throw new Error('Firebase is not configured');
      }

      const auth = getFirebaseAuth();
      const result = await firebaseSignInAnonymously(auth);
      const newProfile = await upsertUserProfile(
        result.user,
        'anonymous',
        displayName
      );
      setProfile(newProfile);
    },
    [isConfigured]
  );

  const signOut = useCallback(async () => {
    if (!isConfigured) {
      return;
    }

    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    setProfile(null);
  }, [isConfigured]);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    isConfigured,
    signInWithGoogle,
    signInAnonymously,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
