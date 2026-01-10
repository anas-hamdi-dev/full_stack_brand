import LoginModal from "./LoginModal";
import SignUpModal from "./SignUpModal";
import { useAuthModal } from "@/contexts/AuthModalContext";

export default function AuthModals() {
  const {
    loginOpen,
    signUpOpen,
    setLoginOpen,
    setSignUpOpen,
    openSignUp,
    openLogin,
  } = useAuthModal();

  return (
    <>
      <LoginModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToSignUp={openSignUp}
      />
      <SignUpModal
        open={signUpOpen}
        onOpenChange={setSignUpOpen}
        onSwitchToLogin={openLogin}
      />
    </>
  );
}
