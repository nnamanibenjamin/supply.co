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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { CheckCircle2Icon, XCircleIcon, ExternalLinkIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";

export default function AdminSuppliersPage() {
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
          <SuppliersContent />
        </Authenticated>
      </div>
    </div>
  );
}

function SuppliersContent() {
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const suppliers = useQuery(api.admin.listSuppliers, { status: selectedStatus });
  const approveSupplier = useMutation(api.admin.approveSupplier);
  const rejectSupplier = useMutation(api.admin.rejectSupplier);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async (supplierId: string) => {
    try {
      await approveSupplier({ supplierId: supplierId as Id<"suppliers"> });
      toast.success("Supplier approved successfully");
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to approve supplier: ${err.message}`);
    }
  };

  const handleRejectClick = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedSupplierId) return;

    try {
      await rejectSupplier({
        supplierId: selectedSupplierId as Id<"suppliers">,
        reason: rejectReason || undefined,
      });
      toast.success("Supplier rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedSupplierId(null);
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to reject supplier: ${err.message}`);
    }
  };

  if (suppliers === undefined) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Supplier Management</h1>
          <p className="text-muted-foreground">Review and approve supplier registrations</p>
        </div>
        <Link to="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      <Tabs
        value={selectedStatus}
        onValueChange={(v) =>
          setSelectedStatus(v as "pending" | "approved" | "rejected")
        }
      >
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="space-y-4 mt-6">
          {suppliers.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  No {selectedStatus} suppliers found
                </p>
              </CardContent>
            </Card>
          ) : (
            suppliers.map((supplier) => (
              <Card key={supplier._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{supplier.companyName}</CardTitle>
                      <CardDescription>
                        Credits: {supplier.credits} | Active: {supplier.isActive ? "Yes" : "No"}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        supplier.verificationStatus === "approved"
                          ? "default"
                          : supplier.verificationStatus === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {supplier.verificationStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                      <p className="text-sm">{supplier.contactPerson}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-sm">{supplier.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-sm">{supplier.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created By</p>
                      <p className="text-sm">
                        {supplier.creatorName} ({supplier.creatorEmail})
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {supplier.categoryNames.map((cat, idx) => (
                        <Badge key={idx} variant="outline">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {supplier.cr12Url && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        CR12 Document
                      </p>
                      <a
                        href={supplier.cr12Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        View CR12 Document
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {supplier.verificationStatus === "pending" && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleApprove(supplier._id)}
                        className="flex-1"
                        size="sm"
                      >
                        <CheckCircle2Icon className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectClick(supplier._id)}
                        variant="destructive"
                        className="flex-1"
                        size="sm"
                      >
                        <XCircleIcon className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Supplier Registration</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this supplier registration (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Invalid CR12, incomplete documentation..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
