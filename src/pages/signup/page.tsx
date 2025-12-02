import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Building2Icon, PackageIcon, UsersIcon } from "lucide-react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import HospitalSignupForm from "./_components/HospitalSignupForm.tsx";
import SupplierSignupForm from "./_components/SupplierSignupForm.tsx";
import JoinHospitalForm from "./_components/JoinHospitalForm.tsx";

type AccountType = "hospital" | "supplier" | "join_hospital" | null;

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") as AccountType;
  const [selectedType, setSelectedType] = useState<AccountType>(initialType);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold">saline.co.ke</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Already have an account?</span>
            <SignInButton>
              <Button variant="ghost">Sign In</Button>
            </SignInButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Create Your Account</h1>
            <p className="text-lg text-muted-foreground">
              Join Kenya's premier medical supply marketplace
            </p>
          </div>

          <Unauthenticated>
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Sign In to Continue</CardTitle>
                <CardDescription>
                  Please sign in with Hercules Auth to create your account
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <SignInButton>
                  <Button size="lg">Sign In to Get Started</Button>
                </SignInButton>
              </CardContent>
            </Card>
          </Unauthenticated>

          <AuthLoading>
            <Card>
              <CardContent className="py-12">
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          </AuthLoading>

          <Authenticated>
            {!selectedType ? (
              <div className="space-y-6">
                <p className="text-center text-muted-foreground">
                  Select your account type to get started
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Hospital */}
                  <Card
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedType("hospital")}
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Building2Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>Hospital</CardTitle>
                      <CardDescription>
                        Create RFQs and find suppliers for your medical facility
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">Sign Up as Hospital</Button>
                    </CardContent>
                  </Card>

                  {/* Supplier */}
                  <Card
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedType("supplier")}
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <PackageIcon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>Supplier</CardTitle>
                      <CardDescription>
                        Receive RFQs and grow your medical supply business
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">Sign Up as Supplier</Button>
                    </CardContent>
                  </Card>

                  {/* Join Hospital */}
                  <Card
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedType("join_hospital")}
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <UsersIcon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>Join Your Hospital</CardTitle>
                      <CardDescription>
                        Join an existing hospital account with a hospital code
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">Join Hospital</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div>
                <Button
                  variant="ghost"
                  className="mb-4"
                  onClick={() => setSelectedType(null)}
                >
                  ← Back to account types
                </Button>

                {selectedType === "hospital" && <HospitalSignupForm />}
                {selectedType === "supplier" && <SupplierSignupForm />}
                {selectedType === "join_hospital" && <JoinHospitalForm />}
              </div>
            )}
          </Authenticated>
        </div>
      </div>
    </div>
  );
}
