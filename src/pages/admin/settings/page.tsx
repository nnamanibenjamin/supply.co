import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  SettingsIcon, 
  CoinsIcon, 
  BuildingIcon, 
  PackageIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from "lucide-react";

export default function AdminSettingsPage() {
  const currentUser = useQuery(api.registration.getCurrentUser);
  const adminAccounts = useQuery(api.adminAccounts.getAdminAccounts);
  const creditSystemStatus = useQuery(api.settings.getSetting, { key: "creditSystemEnabled" });
  const categories = useQuery(api.categories.listAll);
  
  const toggleCreditSystem = useMutation(api.settings.toggleCreditSystem);
  const setupHospital = useMutation(api.adminAccounts.setupAdminHospital);
  const setupSupplier = useMutation(api.adminAccounts.setupAdminSupplier);

  const [creditEnabled, setCreditEnabled] = useState(true);
  const [isHospitalDialogOpen, setIsHospitalDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);

  useEffect(() => {
    if (creditSystemStatus !== undefined) {
      setCreditEnabled(creditSystemStatus !== false);
    }
  }, [creditSystemStatus]);

  if (currentUser === undefined || adminAccounts === undefined || categories === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!currentUser || currentUser.accountType !== "admin") {
    return (
      <Card className="max-w-2xl mx-auto mt-20">
        <CardHeader className="text-center">
          <XCircleIcon className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Admin access required</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link to="/admin">
            <Button>Back to Admin</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleToggleCredit = async () => {
    try {
      const newState = !creditEnabled;
      await toggleCreditSystem({ enabled: newState });
      setCreditEnabled(newState);
      toast.success(
        newState 
          ? "Credit system enabled. Suppliers must purchase credits to submit quotations." 
          : "Credit system disabled. Suppliers can submit unlimited quotations for free."
      );
    } catch (error) {
      toast.error("Failed to toggle credit system");
    }
  };

  const handleSetupHospital = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await setupHospital({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
      });
      toast.success("Admin hospital account created successfully!");
      setIsHospitalDialogOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create hospital account");
      }
    }
  };

  const handleSetupSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedCategories = Array.from(formData.getAll("categories"));
    
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    try {
      await setupSupplier({
        companyName: formData.get("companyName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        categories: selectedCategories as unknown as Id<"categories">[],
      });
      toast.success("Admin supplier account created successfully!");
      setIsSupplierDialogOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create supplier account");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Manage global platform settings and admin accounts</p>
          </div>
        </div>

        {/* Credit System Toggle */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CoinsIcon className="h-5 w-5" />
              <CardTitle>Credit System</CardTitle>
            </div>
            <CardDescription>
              Control whether suppliers need credits to submit quotations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-1">
                <Label htmlFor="credit-toggle" className="text-base font-medium">
                  Enable Credit System
                </Label>
                <p className="text-sm text-muted-foreground">
                  {creditEnabled 
                    ? "Suppliers must purchase credits to submit quotations" 
                    : "Suppliers can submit unlimited quotations for free"}
                </p>
              </div>
              <Switch
                id="credit-toggle"
                checked={creditEnabled}
                onCheckedChange={handleToggleCredit}
              />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
              <Badge variant={creditEnabled ? "default" : "secondary"}>
                {creditEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <span className="text-muted-foreground">
                {creditEnabled 
                  ? "Credit system is currently active"
                  : "All suppliers have unlimited quotation submissions"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Admin Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Accounts</CardTitle>
            <CardDescription>
              Set up hospital and supplier accounts for administrative testing and management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hospital Account */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <BuildingIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Hospital Account</h3>
                  <p className="text-sm text-muted-foreground">
                    {adminAccounts?.hasHospital 
                      ? "Create RFQs (free for suppliers - no credits charged)" 
                      : "Not set up yet"}
                  </p>
                </div>
              </div>
              {adminAccounts?.hasHospital ? (
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <Badge variant="outline">Active</Badge>
                </div>
              ) : (
                <Dialog open={isHospitalDialogOpen} onOpenChange={setIsHospitalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Create Hospital
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Admin Hospital Account</DialogTitle>
                      <DialogDescription>
                        This hospital will be free for all suppliers (no credit deductions)
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSetupHospital} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Hospital Name</Label>
                        <Input id="name" name="name" placeholder="Admin Test Hospital" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="admin@hospital.test" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" placeholder="+254700000000" required />
                      </div>
                      <Button type="submit" className="w-full">Create Hospital Account</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Supplier Account */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <PackageIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Supplier Account</h3>
                  <p className="text-sm text-muted-foreground">
                    {adminAccounts?.hasSupplier 
                      ? "Submit quotations with unlimited credits" 
                      : "Not set up yet"}
                  </p>
                </div>
              </div>
              {adminAccounts?.hasSupplier ? (
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <Badge variant="outline">Active</Badge>
                </div>
              ) : (
                <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Create Supplier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Admin Supplier Account</DialogTitle>
                      <DialogDescription>
                        This supplier will have unlimited credits and no quotation limits
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSetupSupplier} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input id="companyName" name="companyName" placeholder="Admin Test Supplier" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="admin@supplier.test" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" placeholder="+254700000000" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Categories</Label>
                        <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                          {categories.map((category) => (
                            <label key={category._id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                name="categories"
                                value={category._id}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{category.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <Button type="submit" className="w-full">Create Supplier Account</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Info */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Admin accounts are special accounts that bypass credit requirements and limits. 
                Use them for testing and administrative purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-end">
          <Link to="/admin">
            <Button variant="outline">Back to Admin Panel</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
