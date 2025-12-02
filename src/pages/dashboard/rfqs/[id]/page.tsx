import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { FileTextIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function RFQDetailPage() {
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
          <Link to="/dashboard/rfqs">
            <Button variant="ghost">Back to RFQs</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Unauthenticated>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to view this RFQ</CardDescription>
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
            <Skeleton className="h-96 w-full" />
          </div>
        </AuthLoading>

        <Authenticated>
          <RFQDetailContent />
        </Authenticated>
      </div>
    </div>
  );
}

function RFQDetailContent() {
  const { id } = useParams<{ id: string }>();
  const rfq = useQuery(api.rfqs.getRFQ, id ? { rfqId: id as Id<"rfqs"> } : "skip");
  const quotations = useQuery(api.quotations.getRFQQuotations, id ? { rfqId: id as Id<"rfqs"> } : "skip");
  const acceptQuotation = useMutation(api.quotations.acceptQuotation);
  const updateRFQStatus = useMutation(api.rfqs.updateRFQStatus);

  const handleAcceptQuotation = async (quotationId: Id<"quotations">) => {
    try {
      await acceptQuotation({ quotationId });
      toast.success("Quotation accepted! You can now contact the supplier.");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to accept quotation");
      }
    }
  };

  const handleCloseRFQ = async () => {
    if (!id) return;
    try {
      await updateRFQStatus({ rfqId: id as Id<"rfqs">, status: "closed" });
      toast.success("RFQ closed successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to close RFQ");
      }
    }
  };

  if (rfq === undefined || quotations === undefined) {
    return (
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>RFQ Not Found</CardTitle>
          <CardDescription>The RFQ you're looking for doesn't exist</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/dashboard/rfqs">
            <Button>Return to RFQs</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="default">Open</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      case "fulfilled":
        return <Badge className="bg-green-600">Fulfilled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getQuotationStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-600">Accepted</Badge>;
      case "rejected":
        return <Badge variant="secondary">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* RFQ Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{rfq.productName}</CardTitle>
              <CardDescription>
                Created on {new Date(rfq._creationTime).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(rfq.status)}
              {rfq.status === "open" && (
                <Button variant="outline" size="sm" onClick={handleCloseRFQ}>
                  Close RFQ
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p className="text-lg font-semibold">{rfq.category?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quantity</p>
              <p className="text-lg font-semibold">
                {rfq.quantity} {rfq.unit}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivery Location</p>
              <p className="text-lg font-semibold">{rfq.deliveryLocation}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Urgency</p>
              <p className="text-lg font-semibold capitalize">{rfq.urgency}</p>
            </div>
          </div>

          {rfq.specifications && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Specifications</p>
              <p className="text-sm whitespace-pre-wrap">{rfq.specifications}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotations */}
      <Card>
        <CardHeader>
          <CardTitle>Quotations ({quotations.length})</CardTitle>
          <CardDescription>Review and accept quotations from suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          {quotations.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileTextIcon />
                </EmptyMedia>
                <EmptyTitle>No Quotations Yet</EmptyTitle>
                <EmptyDescription>
                  Suppliers are being notified. Check back soon for quotations.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => (
                  <TableRow key={quotation._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{quotation.supplier?.companyName}</p>
                        {quotation.status === "accepted" && quotation.supplier && (
                          <>
                            <p className="text-sm text-muted-foreground">
                              {quotation.supplier.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {quotation.supplier.phone}
                            </p>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {quotation.product ? (
                        <div>
                          <p className="font-medium">{quotation.product.name}</p>
                          {quotation.product.brand && (
                            <p className="text-sm text-muted-foreground">
                              {quotation.product.brand}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Custom</span>
                      )}
                    </TableCell>
                    <TableCell>KES {quotation.unitPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        KES {quotation.totalPrice.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>{quotation.deliveryTime}</TableCell>
                    <TableCell>
                      {quotation.isAutoGenerated ? (
                        <Badge variant="outline">Auto</Badge>
                      ) : (
                        <Badge variant="secondary">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getQuotationStatusBadge(quotation.status)}</TableCell>
                    <TableCell className="text-right">
                      {rfq.status === "open" && quotation.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptQuotation(quotation._id)}
                        >
                          <CheckCircle2Icon className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {rfq.status === "fulfilled" && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2Icon className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold">RFQ Fulfilled</p>
                <p className="text-sm text-muted-foreground">
                  You have accepted a quotation. Contact the supplier using the details above to proceed with your order.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
