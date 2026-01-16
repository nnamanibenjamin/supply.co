// Auth is now handled by ConvexAuthProvider in convex.tsx
// This file is kept for compatibility but just passes through children
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
