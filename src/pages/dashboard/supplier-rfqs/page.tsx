import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { FileTextIcon, CheckCircle2Icon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";

export default function SupplierRFQsPage() {
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
              <CardDescription>Please sign in to view available RFQs</CardDescription>
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
          <RFQsContent />
        </Authenticated>
      </div>
    </div>
  );
}

function RFQsContent() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const rfqs = useQuery(api.rfqs.getAvailableRFQs);

  if (currentUser === undefined || rfqs === undefined) {
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
          <CardDescription>Only suppliers can view available RFQs</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "standard":
        return <Badge variant="outline">Standard</Badge>;
      case "urgent":
        return <Badge variant="secondary">Urgent</Badge>;
      case "emergency":
        return <Badge variant="destructive">Emergency</Badge>;
      default:
        return <Badge variant="outline">{urgency}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Available RFQs</h1>
        <p className="text-muted-foreground">
          Browse and respond to requests for quotations in your categories
        </p>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Your Credits: {currentUser.supplier?.credits || 0}</p>
              <p className="text-sm text-muted-foreground">
                Each quotation costs 1 credit
              </p>
            </div>
            <Button variant="outline">Buy More Credits</Button>
          </div>
        </CardContent>
      </Card>

      {rfqs.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>No Available RFQs</EmptyTitle>
            <EmptyDescription>
              No open RFQs match your categories at the moment. Check back soon!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Hospital</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Quotes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqs.map((rfq) => (
                <TableRow key={rfq._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{rfq.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(rfq._creationTime).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{rfq.hospitalName}</TableCell>
                  <TableCell>{rfq.categoryName}</TableCell>
                  <TableCell>
                    {rfq.quantity} {rfq.unit}
                  </TableCell>
                  <TableCell className="max-w-32 truncate">
                    {rfq.deliveryLocation}
                  </TableCell>
                  <TableCell>{getUrgencyBadge(rfq.urgency)}</TableCell>
                  <TableCell>
                    <span className="font-semibold">{rfq.quotationCount}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {rfq.hasQuoted ? (
                      <div className="flex items-center justify-end gap-2 text-green-600">
                        <CheckCircle2Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">Quoted</span>
                      </div>
                    ) : (
                      <Link to={`/dashboard/supplier-rfqs/${rfq._id}/quote`}>
                        <Button size="sm">Submit Quote</Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
