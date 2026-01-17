import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "@/lib/api";

interface User {
  _id: string;
  id?: string; // For backward compatibility
  email: string;
  full_name: string;
  phone?: string | null;
  role: "client" | "brand_owner" | "admin";
  brand_id?: string | null;
  isEmailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  isLoading: boolean;
  isClient: boolean;
  isBrandOwner: boolean;
  isAdmin: boolean;
  isBrandOwnerApproved: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: "client" | "brand_owner";
    brandData?: {
      name?: string;
      category_id?: string;
      description?: string;
      location?: string;
      website?: string;
      instagram?: string;
      facebook?: string;
    };
  }) => Promise<{ error: Error | null; user?: User }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Normalize user data from backend (convert _id to id for compatibility)
  const normalizeUser = (userData: any): User => {
    return {
      ...userData,
      id: userData._id || userData.id,
    };
  };

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.data?.user) {
            const normalizedUser = normalizeUser(response.data.user);
            setUser(normalizedUser);
            setSession({ user: normalizedUser });
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('auth_token');
            authApi.signOut();
          }
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.signIn(email, password);
      
      if (response.error) {
        return { error: new Error(response.error.message) };
      }

      if (response.data?.user && response.data?.token) {
        const normalizedUser = normalizeUser(response.data.user);
        setUser(normalizedUser);
        setSession({ user: normalizedUser });
        return { error: null };
      }

      return { error: new Error("Invalid response from server") };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Sign in failed") };
    }
  };

  const signUp = async (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: "client" | "brand_owner";
    brandData?: {
      name?: string;
      category_id?: string;
      description?: string;
      location?: string;
      website?: string;
      instagram?: string;
      facebook?: string;
    };
  }) => {
    try {
      const response = await authApi.signUp({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
        brandData: data.brandData,
      });

      if (response.error) {
        return { error: new Error(response.error.message) };
      }

      if (response.data?.user && response.data?.token) {
        const normalizedUser = normalizeUser(response.data.user);
        setUser(normalizedUser);
        setSession({ user: normalizedUser });
        return { error: null, user: normalizedUser };
      }

      return { error: new Error("Invalid response from server") };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Sign up failed") };
    }
  };

  const signOut = async () => {
    try {
      await authApi.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.data?.user) {
        const normalizedUser = normalizeUser(response.data.user);
        setUser(normalizedUser);
        setSession({ user: normalizedUser });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const isClient = user?.role === "client";
  const isBrandOwner = user?.role === "brand_owner";
  const isAdmin = user?.role === "admin";
  // Brand owners are approved if they have a brand_id (brand created)
  const isBrandOwnerApproved = isBrandOwner && !!user?.brand_id;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isClient,
        isBrandOwner,
        isAdmin,
        isBrandOwnerApproved,
        signIn,
        signUp,
        signOut,
        refreshUser,
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
