import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function useAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  return {
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    // Compatibility shims for old Hercules auth API
    signinRedirect: () => {
      // This is now handled differently - sign in is done via the SignIn form
      console.warn("signinRedirect is deprecated, use signIn with credentials");
    },
    removeUser: signOut,
    error: null,
  };
}

export function useUser() {
  const { isAuthenticated } = useConvexAuth();

  return {
    isAuthenticated,
    user: null, // User data should be fetched from Convex using getCurrentUser query
  };
}
