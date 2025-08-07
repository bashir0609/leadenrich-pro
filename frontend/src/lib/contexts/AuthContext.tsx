'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: string; // Make sure role is part of the user type
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'REGISTER_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'INITIALIZE'; payload: { isAuthenticated: boolean; user: User | null } }; // For the initial check

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  isLoading: true, // Start as true
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return { ...state, user: action.payload.user, isLoading: false, error: null };
    case 'LOGIN_ERROR':
    case 'REGISTER_ERROR':
      return { ...state, user: null, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, error: null };
    case 'INITIALIZE':
      return { ...state, user: action.payload.user, isLoading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // --- THIS IS THE CRITICAL LOGIC THAT WAS MISSING ---
  useEffect(() => {
    const checkUserStatus = async () => {
      console.log('[AuthContext] Checking user session...');
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          const response = await apiClient.get('/api/auth/me'); // apiClient now sends the token
          if (response.success && response.data.user) {
            dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: true, user: response.data.user } });
          } else {
            throw new Error('Session invalid');
          }
        } catch (error) {
          localStorage.removeItem('authToken');
          dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
        }
      } else {
        dispatch({ type: 'INITIALIZE', payload: { isAuthenticated: false, user: null } });
      }
    };

    checkUserStatus();
  }, []); // Empty array means this runs once on app load

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      if (response.success && response.data) {
        localStorage.setItem('authToken', response.data.token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: (error as Error).message });
      throw error;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Send in correct order: name, email, password
      const response = await apiClient.post('/api/auth/register', { name, email, password });
      
      if (response.success && response.data) {
        localStorage.setItem('authToken', response.data.token);
        dispatch({ type: 'REGISTER_SUCCESS', payload: response.data });
      } else {
        throw new Error(response.error?.message || 'Registration failed');
      }
    } catch (error) {
      dispatch({ type: 'REGISTER_ERROR', payload: (error as Error).message });
      throw error;
    }
  }, []);


  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    dispatch({ type: 'LOGOUT' });
    // It's good practice to also redirect here
    window.location.href = '/login';
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const generateApiKey = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/auth/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to generate API key');
      }

      const data = await response.json();
      return data.apiKey;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }, []);

  const isAuthenticated = !!state.user;
  const isLoading = state.isLoading;
  const user = state.user;  // Added this computed property

  return (
    <AuthContext.Provider value={{ 
      user: state.user,
      login, 
      register,
      logout, 
      isAuthenticated: !!state.user,
      isLoading: state.isLoading // Use isLoading from state
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}