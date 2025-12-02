import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { FileTextIcon, CheckCircle2Icon, XCircleIcon, ClockIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { useState } from "react";

export default function QuotationsPage() {
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
          <Link to="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Unauthenticated>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to view your quotations</CardDescription>
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
            <Skeleton className="h-96 w-full" />
          </div>
        </AuthLoading>

        <Authenticated>
          <QuotationsContent />
        </Authenticated>
      </div>
    </div>
  );
}

function QuotationsContent() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const [selectedTab, setSelectedTab] = useState("all");

  const allQuotations = useQuery(api.quotations.getSupplierQuotations, {});
  const pendingQuotations = useQuery(api.quotations.getSupplierQuotations, { status: "pending" });
  const acceptedQuotations = useQuery(api.quotations.getSupplierQuotations, { status: "accepted" });
  const rejectedQuotations = useQuery(api.quotations.getSupplierQuotations, { status: "rejected" });

  if (currentUser === undefined || allQuotations === undefined) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!currentUser || currentUser.accountType !== "supplier") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Only suppliers can view quotations</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

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

  const renderQuotationsTable = (quotations: typeof allQuotations) => {
    if (!quotations || quotations.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>No Quotations Found</EmptyTitle>
            <EmptyDescription>
              {selectedTab === "all"
                ? "You haven't submitted any quotations yet."
                : `You don't have any ${selectedTab} quotations.`}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>RFQ / Product</TableHead>
            <TableHead>Hospital</TableHead>
            <TableHead>Your Price</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Delivery</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((quotation) => (
            <TableRow key={quotation._id}>
              <TableCell>
                <div>
                  <p className="font-medium">{quotation.rfq?.productName}</p>
                  {quotation.product && (
                    <p className="text-sm text-muted-foreground">{quotation.product.name}</p>
                  )}
                  {quotation.isAutoGenerated && (
                    <Badge variant="outline" className="mt-1 text-xs">Auto</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{quotation.hospital?.name}</TableCell>
              <TableCell>KES {quotation.unitPrice.toLocaleString()}</TableCell>
              <TableCell>
                <span className="font-semibold">
                  KES {quotation.totalPrice.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>{quotation.deliveryTime}</TableCell>
              <TableCell>{getStatusBadge(quotation.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(quotation._creationTime).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Link to={`/dashboard/quotations/${quotation._id}`}>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Quotations</h1>
          <p className="text-muted-foreground">
            Manage all your submitted quotations
          </p>
        </div>
        <Link to="/dashboard/supplier-rfqs">
          <Button>Browse Available RFQs</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{allQuotations?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <p className="text-2xl font-bold">{pendingQuotations?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-2xl font-bold">{acceptedQuotations?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Accepted</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{rejectedQuotations?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <CardHeader>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="all">{allQuotations && renderQuotationsTable(allQuotations)}</TabsContent>
            <TabsContent value="pending">{pendingQuotations && renderQuotationsTable(pendingQuotations)}</TabsContent>
            <TabsContent value="accepted">{acceptedQuotations && renderQuotationsTable(acceptedQuotations)}</TabsContent>
            <TabsContent value="rejected">{rejectedQuotations && renderQuotationsTable(rejectedQuotations)}</TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
