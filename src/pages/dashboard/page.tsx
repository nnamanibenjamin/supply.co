import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { AlertCircleIcon, CheckCircle2Icon, ClockIcon, XCircleIcon, CoinsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { NotificationsBell } from "@/components/notifications-bell.tsx";

export default function DashboardPage() {
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
          <Authenticated>
            <NotificationsBell />
          </Authenticated>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Unauthenticated>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SignInButton>
                <Button>Sign In</Button>
              </SignInButton>
            </CardContent>
          </Card>
        </Unauthenticated>

        <AuthLoading>
          <div className="max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </AuthLoading>

        <Authenticated>
          <DashboardContent />
        </Authenticated>
      </div>
    </div>
  );
}

function DashboardContent() {
  const currentUser = useQuery(api.registration.getCurrentUser);

  if (currentUser === undefined) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            You need to complete your registration to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link to="/signup">
            <Button>Complete Registration</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2Icon className="h-8 w-8 text-green-600" />;
      case "pending":
        return <ClockIcon className="h-8 w-8 text-yellow-600" />;
      case "rejected":
        return <XCircleIcon className="h-8 w-8 text-red-600" />;
      default:
        return <AlertCircleIcon className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Your account has been approved!";
      case "pending":
        return "Your account is pending verification";
      case "rejected":
        return "Your account has been rejected";
      default:
        return "Unknown status";
    }
  };

  const getStatusDescription = (status: string, accountType: string) => {
    if (status === "approved") {
      return "You can now access all features of the platform.";
    }
    if (status === "pending") {
      return "Our admin team is reviewing your registration. You'll receive a notification once approved.";
    }
    if (status === "rejected") {
      return "Please contact support for more information.";
    }
    return "";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {currentUser.name}</p>
      </div>

      {/* Account Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {getStatusIcon(currentUser.verificationStatus)}
            <div>
              <CardTitle>{getStatusText(currentUser.verificationStatus)}</CardTitle>
              <CardDescription>
                {getStatusDescription(currentUser.verificationStatus, currentUser.accountType)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Type</p>
              <p className="text-lg font-semibold capitalize">
                {currentUser.accountType.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg font-semibold">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-lg font-semibold">{currentUser.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg font-semibold capitalize">{currentUser.verificationStatus}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hospital Details */}
      {currentUser.hospital && (
        <Card>
          <CardHeader>
            <CardTitle>Hospital Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hospital Name</p>
                <p className="text-lg font-semibold">{currentUser.hospital.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hospital Code</p>
                <p className="text-lg font-semibold font-mono bg-muted px-3 py-1 rounded inline-block">
                  {currentUser.hospital.hospitalCode}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                <p className="text-lg font-semibold">{currentUser.hospital.contactPerson}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hospital Email</p>
                <p className="text-lg font-semibold">{currentUser.hospital.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier Details */}
      {currentUser.supplier && (
        <>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CoinsIcon className="h-5 w-5" />
                Credit Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold">{currentUser.supplier.credits}</span>
                <span className="text-xl text-muted-foreground">credits</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/dashboard/credits">
                  <Button size="sm">Purchase Credits</Button>
                </Link>
                <Link to="/dashboard/credits/history">
                  <Button variant="outline" size="sm">View History</Button>
                </Link>
              </div>
              {currentUser.supplier.credits < 5 && (
                <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Your credit balance is low. Purchase more credits to continue submitting quotations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supplier Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Name</p>
                  <p className="text-lg font-semibold">{currentUser.supplier.companyName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                  <p className="text-lg font-semibold">{currentUser.supplier.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Email</p>
                  <p className="text-lg font-semibold">{currentUser.supplier.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-lg font-semibold">{currentUser.supplier.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick Actions */}
      {currentUser.verificationStatus === "approved" && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {(currentUser.accountType === "hospital" || currentUser.accountType === "hospital_staff") && (
                <>
                  <Link to="/rfq/create">
                    <Button className="w-full" variant="outline">
                      Create New RFQ
                    </Button>
                  </Link>
                  <Link to="/dashboard/rfqs">
                    <Button className="w-full" variant="outline">
                      View My RFQs
                    </Button>
                  </Link>
                  <Link to="/dashboard/reports">
                    <Button className="w-full" variant="outline">
                      View Reports
                    </Button>
                  </Link>
                </>
              )}
              {currentUser.accountType === "supplier" && (
                <>
                  <Link to="/dashboard/supplier-rfqs">
                    <Button className="w-full" variant="outline">
                      Browse Available RFQs
                    </Button>
                  </Link>
                  <Link to="/dashboard/quotations">
                    <Button className="w-full" variant="outline">
                      Manage Quotations
                    </Button>
                  </Link>
                  <Link to="/dashboard/products">
                    <Button className="w-full" variant="outline">
                      Manage Products
                    </Button>
                  </Link>
                  <Link to="/dashboard/reports">
                    <Button className="w-full" variant="outline">
                      View Reports
                    </Button>
                  </Link>
                </>
              )}
              {currentUser.accountType === "admin" && (
                <Link to="/admin">
                  <Button className="w-full" variant="default">
                    Admin Panel
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {currentUser.verificationStatus === "pending" && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-center text-muted-foreground">
              While your account is being verified, you can explore the platform but cannot create or respond to RFQs.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
