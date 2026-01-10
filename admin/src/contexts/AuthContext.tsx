import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "@/lib/api";

interface AdminUser {
  _id: string;
  id?: string;
  email: string;
  full_name?: string;
  role: string;
  created_at?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  session: null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "admin_auth";

function getStoredAuth(): { user: AdminUser | null; isAdmin: boolean; token?: string } | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading auth from storage:", error);
  }
  return null;
}

function setStoredAuth(user: AdminUser | null, isAdmin: boolean, token?: string) {
  try {
    if (user && token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, isAdmin, token }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Error storing auth:", error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [session] = useState<null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load auth state and validate token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const stored = getStoredAuth();
        if (stored?.user && stored?.token) {
          // Validate token by fetching current user
          try {
            const response = await authApi.getMe();
            if (response.user && response.user.role === 'admin') {
              setUser(response.user);
              setIsAdmin(true);
            } else {
              // Not an admin, clear auth
              setStoredAuth(null, false);
            }
          } catch (error) {
            // Token invalid, clear auth
            setStoredAuth(null, false);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.signIn(email, password);
      
      if (response.user && response.user.role === 'admin') {
        setUser(response.user);
        setIsAdmin(true);
        setStoredAuth(response.user, true, response.token);
        return { error: null };
      } else {
        return { error: new Error("Access denied. Admin role required.") };
      }
    } catch (error: any) {
      // Extract error message from ApiError or other error types
      let errorMessage = "Login failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      return { error: new Error(errorMessage) };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Admin signup not supported
    return { error: new Error("Admin registration is not available") };
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
    } catch (error) {
      console.error("Signout error:", error);
    } finally {
      setUser(null);
      setIsAdmin(false);
      setStoredAuth(null, false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
  