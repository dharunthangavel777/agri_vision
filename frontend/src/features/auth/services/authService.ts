import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  signOut, 
  updatePassword as updateFirebasePassword,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../../core/firebase.ts';
import { User, AuthResponse } from '../types/auth.ts';

const TOKEN_KEY = 'agri_auth_token';
const USER_KEY = 'agri_user_data';

export const authService = {
  /**
   * Listen to Firebase auth state changes and sync user profile
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        callback(null);
        return;
      }

      try {
        const token = await fbUser.getIdToken();
        localStorage.setItem(TOKEN_KEY, token);

        const profile = await this.syncUserProfile(fbUser);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
        callback(profile);
      } catch (err) {
        console.error('[authService] Error resolving profile on auth state change:', err);
        // Fallback minimal user profile if Firestore read fails
        const fallbackUser: User = {
          id: fbUser.uid,
          identifier: fbUser.email || fbUser.uid,
          email: fbUser.email || '',
          type: fbUser.providerData.some(p => p.providerId === 'google.com') ? 'google' : 'email',
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Farmer',
          photoURL: fbUser.photoURL || undefined,
          location: '',
          farmType: 'Vegetable',
          role: 'farmer',
          createdAt: new Date().toISOString()
        };
        callback(fallbackUser);
      }
    });
  },

  /**
   * Sync Firebase User with Firestore users collection and preserve old data
   */
  async syncUserProfile(fbUser: FirebaseUser, extra?: { name?: string; location?: string; farmType?: string }): Promise<User> {
    const userRef = doc(db, 'users', fbUser.uid);
    let existingData: Partial<User> | null = null;

    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        existingData = snap.data() as User;
      }
    } catch (e) {
      console.warn('[authService] Firestore getDoc failed, falling back:', e);
    }

    const isGoogle = fbUser.providerData.some(p => p.providerId === 'google.com');

    // Build complete user profile
    const profile: User = {
      id: fbUser.uid,
      identifier: fbUser.email || fbUser.uid,
      email: fbUser.email || '',
      type: isGoogle ? 'google' : 'email',
      role: existingData?.role || 'farmer',
      name: extra?.name || existingData?.name || fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Farmer'),
      photoURL: fbUser.photoURL || existingData?.photoURL,
      location: extra?.location || existingData?.location || '',
      farmType: extra?.farmType || existingData?.farmType || 'Vegetable',
      createdAt: existingData?.createdAt || new Date().toISOString()
    };

    // Save to Firestore
    try {
      await setDoc(userRef, profile, { merge: true });
    } catch (e) {
      console.warn('[authService] Firestore setDoc failed:', e);
    }

    // Also sync to backend so server-side features have user info
    try {
      const token = await fbUser.getIdToken();
      await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          location: profile.location,
          farmType: profile.farmType,
          role: profile.role
        })
      });
    } catch {
      // Ignore background server sync error
    }

    return profile;
  },

  /**
   * Sign In with Email & Password (Firebase primary with resilient backend fallback)
   */
  async login(email: string, pass: string): Promise<AuthResponse> {
    const trimmedEmail = email.trim();
    try {
      const cred = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
      const token = await cred.user.getIdToken();
      localStorage.setItem(TOKEN_KEY, token);

      const user = await this.syncUserProfile(cred.user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      return { user, token, isNewUser: false };
    } catch (firebaseErr: any) {
      console.warn('[authService] Firebase signIn error, checking fallback:', firebaseErr?.code || firebaseErr?.message);

      // If Firebase failed due to network-request-failed, user-not-found, or invalid credential, try local backend API
      if (
        firebaseErr?.code === 'auth/network-request-failed' ||
        firebaseErr?.code === 'auth/user-not-found' ||
        firebaseErr?.code === 'auth/invalid-credential' ||
        !firebaseErr?.code
      ) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: trimmedEmail, password: pass })
          });
          const data = await res.json();
          if (res.ok && data.status === 'ok' && data.token && data.user) {
            localStorage.setItem(TOKEN_KEY, data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            return { user: data.user, token: data.token, isNewUser: false };
          }
          if (data.error && firebaseErr?.code === 'auth/network-request-failed') {
            throw new Error(data.error);
          }
        } catch (apiErr: any) {
          if (apiErr?.message && apiErr.message !== 'Failed to fetch') {
            throw apiErr;
          }
        }
      }

      throw firebaseErr;
    }
  },

  /**
   * Create account with Email & Password (Firebase primary with resilient backend fallback)
   */
  async register(
    email: string, 
    pass: string, 
    extra?: { name?: string; location?: string; farmType?: string }
  ): Promise<AuthResponse> {
    const trimmedEmail = email.trim();
    let cred: any = null;
    let firebaseError: any = null;

    try {
      cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
      if (extra?.name) {
        try {
          await updateFirebaseProfile(cred.user, { displayName: extra.name });
        } catch (e) {
          console.warn('[authService] Could not set displayName:', e);
        }
      }
    } catch (err: any) {
      firebaseError = err;
      console.warn('[authService] Firebase createUser error:', err?.code || err?.message);
    }

    if (cred) {
      const token = await cred.user.getIdToken();
      localStorage.setItem(TOKEN_KEY, token);

      const user = await this.syncUserProfile(cred.user, extra);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // Also register or update backend so credentials exist locally for offline/LAN access
      try {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: trimmedEmail,
            password: pass,
            type: 'email',
            name: extra?.name || trimmedEmail.split('@')[0],
            location: extra?.location || '',
            farmType: extra?.farmType || 'Vegetable'
          })
        });
      } catch {
        // Backend register failure ignored since Firebase succeeded
      }

      return { user, token, isNewUser: true };
    }

    // If Firebase failed specifically with network-request-failed or offline, register via backend
    if (firebaseError?.code === 'auth/network-request-failed' || !firebaseError?.code) {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: trimmedEmail,
            password: pass,
            type: 'email',
            name: extra?.name || trimmedEmail.split('@')[0],
            location: extra?.location || '',
            farmType: extra?.farmType || 'Vegetable'
          })
        });
        const data = await res.json();
        if (res.ok && data.status === 'ok' && data.token && data.user) {
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          return { user: data.user, token: data.token, isNewUser: true };
        }
        if (data.error) {
          throw new Error(data.error);
        }
      } catch (backendErr: any) {
        if (backendErr?.message && backendErr.message !== 'Failed to fetch') {
          throw backendErr;
        }
      }
    }

    throw firebaseError;
  },

  /**
   * Sign in / Sign up with Google OAuth
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    const cred = await signInWithPopup(auth, googleProvider);
    const token = await cred.user.getIdToken();
    localStorage.setItem(TOKEN_KEY, token);

    const user = await this.syncUserProfile(cred.user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { user, token, isNewUser: false };
  },

  /**
   * Send Password Reset Email
   */
  async sendPasswordReset(email: string): Promise<void> {
    const trimmedEmail = email.trim();
    let fbSuccess = false;
    let lastError: any = null;

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      fbSuccess = true;
    } catch (e: any) {
      lastError = e;
      console.warn('[authService] Firebase sendPasswordResetEmail failed:', e?.code || e?.message);
    }

    // Also request backend reset OTP
    try {
      const res = await fetch('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: trimmedEmail })
      });
      if (res.ok) {
        return;
      }
    } catch {
      // Backend error
    }

    if (!fbSuccess && lastError) {
      throw lastError;
    }
  },

  /**
   * Reset Password with OTP (exact match to old app functionality)
   */
  async resetPasswordConfirm(data: { identifier: string; otp: string; newPassword: string }): Promise<void> {
    const response = await fetch('/api/auth/reset-password-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const resData = await response.json();
    if (!response.ok || resData.status !== 'ok') {
      throw new Error(resData.error || 'Failed to reset password');
    }
  },

  /**
   * Change user password (for email/password accounts)
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user found');
    }

    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
    await updateFirebasePassword(user, newPassword);
  },

  /**
   * Update Profile Details
   */
  async updateProfile(data: { name: string; location: string; farmType: string }): Promise<User> {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      // Try local update if Firebase user not active
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updated = await res.json();
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    }

    if (data.name) {
      try {
        await updateFirebaseProfile(fbUser, { displayName: data.name });
      } catch (e) {
        console.warn('Update displayName failed:', e);
      }
    }

    const updatedUser = await this.syncUserProfile(fbUser, data);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  /**
   * Get cached or current user profile
   */
  async getProfile(): Promise<User | null> {
    if (auth.currentUser) {
      return await this.syncUserProfile(auth.currentUser);
    }
    const cached = localStorage.getItem(USER_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Sign Out
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch {
      // Ignore signOut error
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
};
