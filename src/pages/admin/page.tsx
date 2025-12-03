import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "react-router-dom";
import { NotificationsBell } from "@/components/notifications-bell.tsx";
import {
  UsersIcon,
  BuildingIcon,
  TruckIcon,
  AlertCircleIcon,
  FileTextIcon,
  CoinsIcon,
} from "lucide-react";

export default function AdminPage() {
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
              <CardTitle>Admin Access Required</CardTitle>
              <CardDescription>Please sign in with an admin account</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SignInButton>
                <Button>Sign In</Button>
              </SignInButton>
            </CardContent>
          </Card>
        </Unauthenticated>

        <AuthLoading>
          <div className="max-w-6xl mx-auto space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </AuthLoading>

        <Authenticated>
          <AdminContent />
        </Authenticated>
      </div>
    </div>
  );
}

function AdminContent() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const stats = useQuery(api.admin.getStats);

  if (currentUser === undefined || stats === undefined) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!currentUser || currentUser.accountType !== "admin") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertCircleIcon className="h-6 w-6 text-red-600" />
            Access Denied
          </CardTitle>
          <CardDescription>
            You do not have admin privileges to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, verifications, and platform settings</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircleIcon className="h-4 w-4 text-yellow-600" />
              Pending Hospitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingHospitals}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircleIcon className="h-4 w-4 text-yellow-600" />
              Pending Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingSuppliers}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileTextIcon className="h-4 w-4 text-blue-600" />
              Open RFQs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.openRfqs}</div>
            <p className="text-xs text-muted-foreground mt-1">Active requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-green-600" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BuildingIcon className="h-4 w-4 text-purple-600" />
              Total Hospitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalHospitals}</div>
            <p className="text-xs text-muted-foreground mt-1">All hospitals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TruckIcon className="h-4 w-4 text-orange-600" />
              Total Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground mt-1">All suppliers</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>Manage platform entities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/admin/hospitals">
              <Button className="w-full" variant="outline">
                <BuildingIcon className="mr-2 h-4 w-4" />
                Manage Hospitals
              </Button>
            </Link>
            <Link to="/admin/suppliers">
              <Button className="w-full" variant="outline">
                <TruckIcon className="mr-2 h-4 w-4" />
                Manage Suppliers
              </Button>
            </Link>
            <Link to="/admin/credit-packages">
              <Button className="w-full" variant="outline">
                <CoinsIcon className="mr-2 h-4 w-4" />
                Credit Packages
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button className="w-full" variant="outline">
                <UsersIcon className="mr-2 h-4 w-4" />
                All Users
              </Button>
            </Link>
            <Link to="/admin/rfqs">
              <Button className="w-full" variant="outline">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Monitor RFQs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
