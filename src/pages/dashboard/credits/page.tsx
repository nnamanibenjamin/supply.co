import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Link } from "react-router-dom";
import { CoinsIcon, CheckIcon, AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function CreditsPage() {
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
          <Link to="/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Unauthenticated>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to purchase credits</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SignInButton>
                <Button>Sign In</Button>
              </SignInButton>
            </CardContent>
          </Card>
        </Unauthenticated>

        <AuthLoading>
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </AuthLoading>

        <Authenticated>
          <CreditsContent />
        </Authenticated>
      </div>
    </div>
  );
}

function CreditsContent() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const creditBalance = useQuery(api.credits.getCreditBalance);
  const packages = useQuery(api.credits.getPackages);
  const simulatePurchase = useMutation(api.credits.simulatePurchase);
  const [loading, setLoading] = useState<string | null>(null);

  if (currentUser === undefined || packages === undefined || creditBalance === undefined) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.accountType !== "supplier") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Suppliers Only</CardTitle>
          <CardDescription>
            Only suppliers can purchase credits
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (currentUser.verificationStatus !== "approved") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <AlertCircleIcon className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
          <CardTitle>Account Verification Required</CardTitle>
          <CardDescription>
            Your supplier account must be verified before you can purchase credits
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handlePurchase = async (packageId: Id<"creditPackages">) => {
    try {
      setLoading(packageId);
      const result = await simulatePurchase({ packageId });
      toast.success(`Successfully added ${result.creditsAdded} credits! New balance: ${result.newBalance}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to purchase credits");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Purchase Credits</h1>
        <p className="text-muted-foreground">
          Credits are used to submit quotations to hospital RFQs
        </p>
      </div>

      {/* Current Balance */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CoinsIcon className="h-5 w-5" />
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{creditBalance.credits}</span>
            <span className="text-xl text-muted-foreground">credits</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Link to="/dashboard/credits/history">
              <Button variant="outline" size="sm">View Transaction History</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Packages</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg._id} className="relative flex flex-col">
              {pkg.displayOrder === 2 && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
                {pkg.description && (
                  <CardDescription>{pkg.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">
                      KES {pkg.priceKES.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {pkg.credits} credits
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        Submit {pkg.credits} quotations to RFQs
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        Credits never expire
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">
                        Instant credit top-up
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full mt-6"
                  onClick={() => handlePurchase(pkg._id)}
                  disabled={loading !== null}
                >
                  {loading === pkg._id ? "Processing..." : "Purchase Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold">How Credits Work</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Each quotation submission costs 1 credit</li>
              <li>Credits are deducted when you submit a quotation to an RFQ</li>
              <li>If your quotation is accepted, you'll receive hospital contact details</li>
              <li>Credits never expire and can be used at any time</li>
              <li>Currently in development mode - purchases are simulated</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
