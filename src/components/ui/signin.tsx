import { forwardRef, useState } from "react";
import { type VariantProps } from "class-variance-authority";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { toast } from "sonner";

export interface SignInButtonProps
  extends Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof buttonVariants> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  showIcon?: boolean;
  signInText?: string;
  signOutText?: string;
  loadingText?: string;
  asChild?: boolean;
}

export const SignInButton = forwardRef<HTMLButtonElement, SignInButtonProps>(
  (
    {
      onClick,
      disabled,
      showIcon = true,
      signInText = "Sign In",
      signOutText = "Sign Out",
      loadingText,
      className,
      variant,
      size,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
    const { signIn, signOut } = useAuthActions();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSignOut = async () => {
      try {
        await signOut();
        toast.success("Signed out successfully");
      } catch (err) {
        console.error("Sign out error:", err);
        toast.error("Failed to sign out");
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        const formData = new FormData();
        formData.set("email", email);
        formData.set("password", password);
        formData.set("flow", isSignUp ? "signUp" : "signIn");

        await signIn("password", formData);
        setIsDialogOpen(false);
        setEmail("");
        setPassword("");
        toast.success(isSignUp ? "Account created successfully" : "Signed in successfully");
      } catch (err) {
        console.error("Auth error:", err);
        toast.error(isSignUp ? "Failed to create account" : "Invalid email or password");
      } finally {
        setIsSubmitting(false);
      }
    };

    const isLoading = authLoading || isSubmitting;
    const isDisabled = disabled || isLoading;
    const defaultLoadingText = isAuthenticated ? "Signing Out..." : "Signing In...";
    const currentLoadingText = loadingText || defaultLoadingText;

    const buttonText = isLoading
      ? currentLoadingText
      : isAuthenticated
        ? signOutText
        : signInText;

    const icon = isLoading ? (
      <Loader2 className="size-4 animate-spin" />
    ) : isAuthenticated ? (
      <LogOut className="size-4" />
    ) : (
      <LogIn className="size-4" />
    );

    if (isAuthenticated) {
      return (
        <Button
          ref={ref}
          onClick={handleSignOut}
          disabled={isDisabled}
          variant={variant}
          size={size}
          className={className}
          asChild={asChild}
          aria-label="Sign out of your account"
          {...props}
        >
          {showIcon && icon}
          {buttonText}
        </Button>
      );
    }

    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            ref={ref}
            disabled={isDisabled}
            variant={variant}
            size={size}
            className={className}
            asChild={asChild}
            aria-label="Sign in to your account"
            {...props}
          >
            {showIcon && icon}
            {buttonText}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isSignUp ? "Create Account" : "Sign In"}</DialogTitle>
            <DialogDescription>
              {isSignUp
                ? "Create a new account to get started"
                : "Enter your credentials to sign in"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    );
  },
);

SignInButton.displayName = "SignInButton";
