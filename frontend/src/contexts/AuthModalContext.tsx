import { createContext, useContext, useState, ReactNode } from "react";

interface AuthModalContextType {
  loginOpen: boolean;
  signUpOpen: boolean;
  completeBrandDetailsOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  setSignUpOpen: (open: boolean) => void;
  setCompleteBrandDetailsOpen: (open: boolean) => void;
  openLogin: () => void;
  openSignUp: () => void;
  openCompleteBrandDetails: () => void;
  closeModals: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [completeBrandDetailsOpen, setCompleteBrandDetailsOpen] = useState(false);

  const openLogin = () => {
    setSignUpOpen(false);
    setCompleteBrandDetailsOpen(false);
    setLoginOpen(true);
  };

  const openSignUp = () => {
    setLoginOpen(false);
    setCompleteBrandDetailsOpen(false);
    setSignUpOpen(true);
  };

  const openCompleteBrandDetails = () => {
    setLoginOpen(false);
    setSignUpOpen(false);
    setCompleteBrandDetailsOpen(true);
  };

  const closeModals = () => {
    setLoginOpen(false);
    setSignUpOpen(false);
    setCompleteBrandDetailsOpen(false);
  };

  return (
    <AuthModalContext.Provider
      value={{
        loginOpen,
        signUpOpen,
        completeBrandDetailsOpen,
        setLoginOpen,
        setSignUpOpen,
        setCompleteBrandDetailsOpen,
        openLogin,
        openSignUp,
        openCompleteBrandDetails,
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

