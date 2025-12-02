import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Building2Icon } from "lucide-react";

export default function Login() {
  const { signinRedirect } = useAuth();

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold">saline.co.ke</span>
          </Link>
          <h1 className="text-3xl font-bold mt-6">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building2Icon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your hospital or supplier dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg" onClick={() => signinRedirect()}>
              Sign In with Hercules Auth
            </Button>

            <div className="bg-muted/50 border rounded-lg p-3 text-xs text-muted-foreground">
              <strong>Note:</strong> Your account must be approved by our admin team before you can sign in. 
              If you just registered, please wait for approval notification via email.
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Sign Up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
