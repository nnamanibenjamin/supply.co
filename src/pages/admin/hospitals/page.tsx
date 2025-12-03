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

export default function AdminHospitalsPage() {
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
          <HospitalsContent />
        </Authenticated>
      </div>
    </div>
  );
}

function HospitalsContent() {
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const hospitals = useQuery(api.admin.listHospitals, { status: selectedStatus });
  const approveHospital = useMutation(api.admin.approveHospital);
  const rejectHospital = useMutation(api.admin.rejectHospital);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async (hospitalId: string) => {
    try {
      await approveHospital({ hospitalId: hospitalId as Id<"hospitals"> });
      toast.success("Hospital approved successfully");
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to approve hospital: ${err.message}`);
    }
  };

  const handleRejectClick = (hospitalId: string) => {
    setSelectedHospitalId(hospitalId);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedHospitalId) return;

    try {
      await rejectHospital({
        hospitalId: selectedHospitalId as Id<"hospitals">,
        reason: rejectReason || undefined,
      });
      toast.success("Hospital rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedHospitalId(null);
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to reject hospital: ${err.message}`);
    }
  };

  if (hospitals === undefined) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Hospital Management</h1>
          <p className="text-muted-foreground">Review and approve hospital registrations</p>
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
          {hospitals.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  No {selectedStatus} hospitals found
                </p>
              </CardContent>
            </Card>
          ) : (
            hospitals.map((hospital) => (
              <Card key={hospital._id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{hospital.name}</CardTitle>
                      <CardDescription>
                        Hospital Code: <span className="font-mono">{hospital.hospitalCode}</span>
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        hospital.verificationStatus === "approved"
                          ? "default"
                          : hospital.verificationStatus === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {hospital.verificationStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                      <p className="text-sm">{hospital.contactPerson}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-sm">{hospital.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-sm">{hospital.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created By</p>
                      <p className="text-sm">
                        {hospital.creatorName} ({hospital.creatorEmail})
                      </p>
                    </div>
                  </div>

                  {hospital.licenseUrl && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Medical License
                      </p>
                      <a
                        href={hospital.licenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        View License Document
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {hospital.verificationStatus === "pending" && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => handleApprove(hospital._id)}
                        className="flex-1"
                        size="sm"
                      >
                        <CheckCircle2Icon className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectClick(hospital._id)}
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
            <DialogTitle>Reject Hospital Registration</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this hospital registration (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Invalid medical license, incomplete documentation..."
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
