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
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";

export default function AdminCreditPackagesPage() {
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
          <CreditPackagesContent />
        </Authenticated>
      </div>
    </div>
  );
}

function CreditPackagesContent() {
  const packages = useQuery(api.admin.listAllCreditPackages);
  const createPackage = useMutation(api.admin.createCreditPackage);
  const updatePackage = useMutation(api.admin.updateCreditPackage);
  const deletePackage = useMutation(api.admin.deleteCreditPackage);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{
    _id: string;
    name: string;
    credits: number;
    priceKES: number;
    description?: string;
    displayOrder: number;
    isActive: boolean;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    credits: 0,
    priceKES: 0,
    description: "",
    displayOrder: 0,
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      credits: 0,
      priceKES: 0,
      description: "",
      displayOrder: 0,
      isActive: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.name || formData.credits <= 0 || formData.priceKES <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createPackage(formData);
      toast.success("Credit package created");
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to create package: ${err.message}`);
    }
  };

  const handleEditClick = (pkg: {
    _id: string;
    name: string;
    credits: number;
    priceKES: number;
    description?: string;
    displayOrder: number;
    isActive: boolean;
  }) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      credits: pkg.credits,
      priceKES: pkg.priceKES,
      description: pkg.description || "",
      displayOrder: pkg.displayOrder,
      isActive: pkg.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedPackage) return;

    try {
      await updatePackage({
        packageId: selectedPackage._id as Id<"creditPackages">,
        ...formData,
      });
      toast.success("Credit package updated");
      setEditDialogOpen(false);
      resetForm();
      setSelectedPackage(null);
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to update package: ${err.message}`);
    }
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm("Are you sure you want to delete this credit package?")) return;

    try {
      await deletePackage({ packageId: packageId as Id<"creditPackages"> });
      toast.success("Credit package deleted");
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to delete package: ${err.message}`);
    }
  };

  if (packages === undefined) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Credit Package Management</h1>
          <p className="text-muted-foreground">Create and manage credit packages for suppliers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Package
          </Button>
          <Link to="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{pkg.name}</CardTitle>
                  <CardDescription>{pkg.credits} credits</CardDescription>
                </div>
                <Badge variant={pkg.isActive ? "default" : "secondary"}>
                  {pkg.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold">KES {pkg.priceKES.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  KES {(pkg.priceKES / pkg.credits).toFixed(2)} per credit
                </p>
              </div>
              {pkg.description && (
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
              )}
              <div className="text-xs text-muted-foreground">Display Order: {pkg.displayOrder}</div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleEditClick(pkg)}>
                  <EditIcon className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(pkg._id)}
                >
                  <TrashIcon className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Credit Package</DialogTitle>
            <DialogDescription>Add a new credit package for suppliers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name*</Label>
              <Input
                id="name"
                placeholder="e.g., Starter Pack"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credits">Credits*</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  value={formData.credits}
                  onChange={(e) =>
                    setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (KES)*</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  value={formData.priceKES}
                  onChange={(e) =>
                    setFormData({ ...formData, priceKES: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Package</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Credit Package</DialogTitle>
            <DialogDescription>Update credit package details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Package Name*</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-credits">Credits*</Label>
                <Input
                  id="edit-credits"
                  type="number"
                  min="1"
                  value={formData.credits}
                  onChange={(e) =>
                    setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (KES)*</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="1"
                  value={formData.priceKES}
                  onChange={(e) =>
                    setFormData({ ...formData, priceKES: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-displayOrder">Display Order</Label>
              <Input
                id="edit-displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Package</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
