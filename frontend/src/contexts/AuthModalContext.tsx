import { createContext, useContext, useState, ReactNode } from "react";

interface AuthModalContextType {
  loginOpen: boolean;
  signUpOpen: boolean;
  defaultSignUpRole: "client" | "brand_owner" | null;
  setLoginOpen: (open: boolean) => void;
  setSignUpOpen: (open: boolean) => void;
  openLogin: () => void;
  openSignUp: () => void;
  openSignUpAsBrandOwner: () => void;
  closeModals: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [defaultSignUpRole, setDefaultSignUpRole] = useState<"client" | "brand_owner" | null>(null);

  const openLogin = () => {
    setSignUpOpen(false);
    setLoginOpen(true);
  };

  const openSignUp = () => {
    setLoginOpen(false);
    setDefaultSignUpRole(null);
    setSignUpOpen(true);
  };

  const openSignUpAsBrandOwner = () => {
    setLoginOpen(false);
    setDefaultSignUpRole("brand_owner");
    setSignUpOpen(true);
  };

  const handleSetSignUpOpen = (open: boolean) => {
    setSignUpOpen(open);
    if (!open) {
      // Reset default role when modal closes
      setDefaultSignUpRole(null);
    }
  };

  const closeModals = () => {
    setLoginOpen(false);
    setSignUpOpen(false);
    setDefaultSignUpRole(null);
  };

  return (
    <AuthModalContext.Provider
      value={{
        loginOpen,
        signUpOpen,
        defaultSignUpRole,
        setLoginOpen,
        setSignUpOpen: handleSetSignUpOpen,
        openLogin,
        openSignUp,
        openSignUpAsBrandOwner,
        closeModals,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}

