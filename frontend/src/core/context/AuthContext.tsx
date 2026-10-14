import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../../features/auth/types/auth.ts';
import { authService } from '../../features/auth/services/authService.ts';
import { useHistoryStore } from '../../features/history/stores/historyStore.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, extra?: { name?: string; location?: string; farmType?: string }) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPasswordConfirm: (data: { identifier: string; otp: string; newPassword: string }) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (data: { name: string; location: string; farmType: string }) => Promise<void>;
  logout: () => Promise<void>;
  // Backwards compatibility alias
  resetPasswordRequest?: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('agri_user_data');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const setCurrentHistoryUser = useHistoryStore((state) => state.setCurrentUser);

  useEffect(() => {
    // Listen to real-time Firebase Auth state changes
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setCurrentHistoryUser(currentUser?.id ?? null);
      setLoading(false);
    });

    // Safety timeout: Ensure loading spinner never hangs indefinitely if network is sluggish
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [setCurrentHistoryUser]);

  const login = async (email: string, pass: string): Promise<AuthResponse> => {
    const response = await authService.login(email, pass);
    setUser(response.user);
    setCurrentHistoryUser(response.user.id);
    return response;
  };

  const register = async (
    email: string, 
    pass: string, 
    extra?: { name?: string; location?: string; farmType?: string }
  ): Promise<AuthResponse> => {
    const response = await authService.register(email, pass, extra);
    setUser(response.user);
    setCurrentHistoryUser(response.user.id);
    return response;
  };

  const loginWithGoogle = async (): Promise<AuthResponse> => {
    const response = await authService.signInWithGoogle();
    setUser(response.user);
    setCurrentHistoryUser(response.user.id);
    return response;
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    await authService.sendPasswordReset(email);
  };

  const resetPasswordConfirm = async (data: { identifier: string; otp: string; newPassword: string }): Promise<void> => {
    await authService.resetPasswordConfirm(data);
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    await authService.changePassword(oldPassword, newPassword);
  };

  const updateProfile = async (data: { name: string; location: string; farmType: string }) => {
    const updated = await authService.updateProfile(data);
    setUser(updated);
  };

  const logout = async () => {
    await authService.logout();
    setCurrentHistoryUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      loginWithGoogle,
      sendPasswordReset,
      resetPasswordRequest: sendPasswordReset,
      resetPasswordConfirm,
      changePassword, 
      updateProfile, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
