import { atom, type Store } from '@nexus-state/core';
import { persist, localStorageStorage } from '@nexus-state/persist';
import { z } from 'zod';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

// Zod schemas for validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Atoms
export const tokenAtom = atom<string | null>(null);
export const userAtom = atom<User | null>((get) => {
  const token = get(tokenAtom);
  if (!token) return null;
  
  // In a real app, you would fetch the user from an API
  return {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
  };
});

export const authStateAtom = atom<AuthState>((get) => {
  const user = get(userAtom);
  return {
    isAuthenticated: !!user,
    user,
  };
});

// Persist plugin configuration for token
export const tokenPersistConfig = {
  key: 'auth-token',
  storage: localStorageStorage,
  serialize: (value: string | null) => JSON.stringify(value),
  deserialize: (value: string) => JSON.parse(value) as string | null,
};

// Apply persist plugin to store
export function applyAuthPersist(store: Store) {
  persist(tokenAtom, tokenPersistConfig)(store);
}

// Validation function
export function validateLogin(data: LoginFormData) {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    const errors: Partial<Record<keyof LoginFormData, string>> = {};
    result.error.errors.forEach((err) => {
      const field = err.path[0] as keyof LoginFormData;
      errors[field] = err.message;
    });
    return errors;
  }
  return {};
}

// Auth service (mock implementation)
export const authService = {
  login: async (email: string, password: string): Promise<string> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock validation
    if (email === 'demo@example.com' && password === 'password') {
      return 'mock-jwt-token-12345';
    }
    
    throw new Error('Invalid email or password');
  },

  logout: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  },

  getCurrentUser: async (): Promise<User> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return {
      id: '1',
      email: 'demo@example.com',
      name: 'John Doe',
    };
  },
};
