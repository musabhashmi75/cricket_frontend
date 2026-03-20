import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);
const STORAGE_KEY = 'cricket_auth';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadFromStorage);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    // data: { token, userId, userName, email, role, passwordResetRequired }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // Called after user successfully changes their own password
  const clearPasswordResetFlag = useCallback(() => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, passwordResetRequired: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      clearPasswordResetFlag,
      isAdmin: user?.role === 'ADMIN',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
