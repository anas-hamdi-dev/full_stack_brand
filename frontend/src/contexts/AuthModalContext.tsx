import { createContext, useContext, useState, ReactNode } from "react";

interface AuthModalContextType {
  loginOpen: boolean;
  signUpOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  setSignUpOpen: (open: boolean) => void;
  openLogin: () => void;
  openSignUp: () => void;
  closeModals: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);

  const openLogin = () => {
    setSignUpOpen(false);
    setLoginOpen(true);
  };

  const openSignUp = () => {
    setLoginOpen(false);
    setSignUpOpen(true);
  };

  const closeModals = () => {
    setLoginOpen(false);
    setSignUpOpen(false);
  };

  return (
    <AuthModalContext.Provider
      value={{
        loginOpen,
        signUpOpen,
        setLoginOpen,
        setSignUpOpen,
        openLogin,
        openSignUp,
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

