import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "customer" | "rider";
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("nexamove_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("nexamove_token")
  );

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem("nexamove_token", newToken);
    localStorage.setItem("nexamove_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("nexamove_token");
    localStorage.removeItem("nexamove_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token && !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
