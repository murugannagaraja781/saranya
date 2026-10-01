import React, { createContext, useContext, useState } from 'react';
import { User } from '../types/shared';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isMockMode: boolean;
  login: () => void;
  logout: () => void;
}

const mockUser: User = {
  id: 'user-naga-1',
  name: 'Naga',
  email: 'naga@example.com',
  phone: '+916382379565',
  role: 'owner',
  timezone: 'Asia/Kolkata',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const AuthContext = createContext<AuthContextType>({
  user: mockUser,
  isAuthenticated: true,
  isMockMode: true,
  login: () => {},
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(mockUser);

  const login = () => setUser(mockUser);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isMockMode: true,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
