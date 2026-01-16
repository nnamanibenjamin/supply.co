import { Authenticated } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { toast } from "sonner";
import { Bell, Mail } from "lucide-react";

function SettingsPageInner() {
  const currentUser = useQuery(api.registration.getCurrentUser);
  const updatePreferences = useMutation(api.users.updateUserPreferences);

  const handleToggleEmailNotifications = async (enabled: boolean) => {
    try {
      await updatePreferences({ emailNotifications: enabled });
      toast.success(
        enabled
          ? "Email notifications enabled"
          : "Email notifications disabled"
      );
    } catch (error) {
      toast.error("Failed to update notification preferences");
    }
  };

  if (!currentUser) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const emailNotificationsEnabled =
    currentUser.preferences?.emailNotifications !== false;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start gap-3 flex-1">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <Label htmlFor="email-notifications" className="text-base cursor-pointer">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for important events like new
                  RFQs, quotations, and account updates
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotificationsEnabled}
              onCheckedChange={handleToggleEmailNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Name</Label>
            <p className="text-base font-medium">{currentUser.name}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="text-base font-medium">{currentUser.email}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Phone</Label>
            <p className="text-base font-medium">{currentUser.phone}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">
              Account Type
            </Label>
            <p className="text-base font-medium capitalize">
              {currentUser.accountType.replace("_", " ")}
            </p>
          </div>
          {currentUser.hospital && (
            <div>
              <Label className="text-sm text-muted-foreground">
                Hospital
              </Label>
              <p className="text-base font-medium">{currentUser.hospital.name}</p>
            </div>
          )}
          {currentUser.supplier && (
            <div>
              <Label className="text-sm text-muted-foreground">
                Company
              </Label>
              <p className="text-base font-medium">
                {currentUser.supplier.companyName}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Authenticated>
      <SettingsPageInner />
    </Authenticated>
  );
}
