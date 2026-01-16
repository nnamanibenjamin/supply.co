import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "react-router-dom";
import { NotificationsBell } from "@/components/notifications-bell.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { toast } from "sonner";

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-background">
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
          <Skeleton className="h-96 w-full" />
        </AuthLoading>

        <Authenticated>
          <UsersContent />
        </Authenticated>
      </div>
    </div>
  );
}

function UsersContent() {
  const currentUser = useQuery(api.registration.getCurrentUser);
  const isAdmin = currentUser?.accountType === "admin";
  const allUsers = useQuery(api.admin.listAllUsers, isAdmin ? {} : "skip");
  const toggleUserActive = useMutation(api.admin.toggleUserActive);

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserActive({ userId: userId as Id<"users"> });
      toast.success(`User ${currentStatus ? "deactivated" : "activated"} successfully`);
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to update user: ${err.message}`);
    }
  };

  if (currentUser === undefined || allUsers === undefined) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!currentUser || currentUser.accountType !== "admin") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You do not have admin privileges to access this page</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link to="/admin">
            <Button>Back to Admin</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const hospitals = allUsers.filter((u) => u.accountType === "hospital");
  const suppliers = allUsers.filter((u) => u.accountType === "supplier");
  const staff = allUsers.filter((u) => u.accountType === "hospital_staff");
  const admins = allUsers.filter((u) => u.accountType === "admin");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">View and manage all platform users</p>
        </div>
        <Link to="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({allUsers.length})</TabsTrigger>
          <TabsTrigger value="hospitals">Hospitals ({hospitals.length})</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers ({suppliers.length})</TabsTrigger>
          <TabsTrigger value="staff">Staff ({staff.length})</TabsTrigger>
          <TabsTrigger value="admins">Admins ({admins.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <UserTable users={allUsers} onToggleActive={handleToggleActive} />
        </TabsContent>
        <TabsContent value="hospitals" className="space-y-4 mt-6">
          <UserTable users={hospitals} onToggleActive={handleToggleActive} />
        </TabsContent>
        <TabsContent value="suppliers" className="space-y-4 mt-6">
          <UserTable users={suppliers} onToggleActive={handleToggleActive} />
        </TabsContent>
        <TabsContent value="staff" className="space-y-4 mt-6">
          <UserTable users={staff} onToggleActive={handleToggleActive} />
        </TabsContent>
        <TabsContent value="admins" className="space-y-4 mt-6">
          <UserTable users={admins} onToggleActive={handleToggleActive} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserTable({
  users,
  onToggleActive,
}: {
  users: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    accountType: string;
    verificationStatus: string;
    isActive: boolean;
  }[];
  onToggleActive: (userId: string, currentStatus: boolean) => void;
}) {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">No users found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Email</th>
                <th className="text-left p-4 font-medium">Phone</th>
                <th className="text-left p-4 font-medium">Type</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Active</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-4">{user.name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                  <td className="p-4 text-sm">{user.phone}</td>
                  <td className="p-4">
                    <Badge variant="outline" className="capitalize">
                      {user.accountType.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={
                        user.verificationStatus === "approved"
                          ? "default"
                          : user.verificationStatus === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {user.verificationStatus}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {user.accountType !== "admin" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onToggleActive(user._id, user.isActive)}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
