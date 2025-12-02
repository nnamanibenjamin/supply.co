import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { CheckCircle2Icon, XCircleIcon, ClockIcon, EditIcon, Trash2Icon, AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";

export default function QuotationDetailPage() {
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
          <Link to="/dashboard/quotations">
            <Button variant="ghost">Back to Quotations</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Unauthenticated>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to view this quotation</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SignInButton>
                <Button>Sign In</Button>
              </SignInButton>
            </CardContent>
          </Card>
        </Unauthenticated>

        <AuthLoading>
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-96 w-full" />
          </div>
        </AuthLoading>

        <Authenticated>
          <QuotationDetailContent />
        </Authenticated>
      </div>
    </div>
  );
}

function QuotationDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quotation = useQuery(
    api.quotations.getQuotation,
    id ? { quotationId: id as Id<"quotations"> } : "skip"
  );
  const updateQuotation = useMutation(api.quotations.updateQuotation);
  const withdrawQuotation = useMutation(api.quotations.withdrawQuotation);

  const [isEditing, setIsEditing] = useState(false);
  const [unitPrice, setUnitPrice] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [notes, setNotes] = useState("");

  if (quotation === undefined) {
    return (
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quotation Not Found</CardTitle>
          <CardDescription>The quotation you're looking for doesn't exist</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/dashboard/quotations">
            <Button>Return to Quotations</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const handleEditToggle = () => {
    if (!isEditing) {
      setUnitPrice(quotation.unitPrice.toString());
      setDeliveryTime(quotation.deliveryTime);
      setNotes(quotation.notes || "");
    }
    setIsEditing(!isEditing);
  };

  const handleUpdate = async () => {
    if (!id) return;
    try {
      const parsedPrice = parseFloat(unitPrice);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        toast.error("Please enter a valid unit price");
        return;
      }
      if (!deliveryTime.trim()) {
        toast.error("Please enter delivery time");
        return;
      }

      await updateQuotation({
        quotationId: id as Id<"quotations">,
        unitPrice: parsedPrice,
        deliveryTime: deliveryTime.trim(),
        notes: notes.trim() || undefined,
      });
      toast.success("Quotation updated successfully");
      setIsEditing(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update quotation");
      }
    }
  };

  const handleWithdraw = async () => {
    if (!id) return;
    try {
      await withdrawQuotation({ quotationId: id as Id<"quotations"> });
      toast.success("Quotation withdrawn and credit refunded");
      navigate("/dashboard/quotations");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to withdraw quotation");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <ClockIcon className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-green-600 gap-1">
            <CheckCircle2Icon className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircleIcon className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canEdit = quotation.status === "pending" && quotation.rfq?.status === "open";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quotation Details</h1>
          <p className="text-muted-foreground">
            Submitted on {new Date(quotation._creationTime).toLocaleDateString()}
          </p>
        </div>
        {getStatusBadge(quotation.status)}
      </div>

      {/* RFQ Details */}
      <Card>
        <CardHeader>
          <CardTitle>RFQ Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hospital</p>
              <p className="text-lg font-semibold">{quotation.hospital?.name}</p>
              {quotation.status === "accepted" && quotation.hospital && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm font-medium">Contact Details:</p>
                  <p className="text-sm">{quotation.hospital.email}</p>
                  <p className="text-sm">{quotation.hospital.phone}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Product Requested</p>
              <p className="text-lg font-semibold">{quotation.rfq?.productName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quantity</p>
              <p className="text-lg font-semibold">
                {quotation.rfq?.quantity} {quotation.rfq?.unit}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivery Location</p>
              <p className="text-lg font-semibold">{quotation.rfq?.deliveryLocation}</p>
            </div>
          </div>
          {quotation.rfq?.specifications && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Specifications</p>
              <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">
                {quotation.rfq.specifications}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotation Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Quotation</CardTitle>
            {canEdit && !isEditing && (
              <Button size="sm" variant="outline" onClick={handleEditToggle}>
                <EditIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="unitPrice">Unit Price (KES)</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="Enter unit price"
                />
              </div>
              <div>
                <Label htmlFor="deliveryTime">Delivery Time</Label>
                <Input
                  id="deliveryTime"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="e.g., 3-5 business days"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional information..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdate}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {quotation.product && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your Product</p>
                  <p className="text-lg font-semibold">{quotation.product.name}</p>
                  {quotation.product.brand && (
                    <p className="text-sm text-muted-foreground">{quotation.product.brand}</p>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unit Price</p>
                <p className="text-lg font-semibold">KES {quotation.unitPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Price</p>
                <p className="text-2xl font-bold">KES {quotation.totalPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Time</p>
                <p className="text-lg font-semibold">{quotation.deliveryTime}</p>
              </div>
              {quotation.notes && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">
                    {quotation.notes}
                  </p>
                </div>
              )}
              {quotation.isAutoGenerated && (
                <div className="md:col-span-2">
                  <Badge variant="outline">Auto-generated from your product catalog</Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {quotation.status === "accepted" && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2Icon className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold">Quotation Accepted!</p>
                <p className="text-sm text-muted-foreground">
                  The hospital has accepted your quotation. Contact them using the details above to proceed with the order.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {quotation.status === "rejected" && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircleIcon className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="font-semibold">Quotation Rejected</p>
                <p className="text-sm text-muted-foreground">
                  This quotation was not selected by the hospital.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canEdit && !isEditing && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <AlertCircleIcon className="h-6 w-6 text-yellow-600" />
                <div>
                  <p className="font-semibold">Quotation Pending</p>
                  <p className="text-sm text-muted-foreground">
                    You can edit or withdraw this quotation while it's pending.
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2Icon className="h-4 w-4 mr-1" />
                    Withdraw
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Withdraw Quotation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your quotation. Your credit will be refunded. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleWithdraw}>
                      Withdraw & Refund
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
