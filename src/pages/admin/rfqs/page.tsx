import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "react-router-dom";
import { NotificationsBell } from "@/components/notifications-bell.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useState } from "react";

export default function AdminRfqsPage() {
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
          <RfqsContent />
        </Authenticated>
      </div>
    </div>
  );
}

function RfqsContent() {
  const currentUser = useQuery(api.auth.getCurrentUser);
  const [selectedStatus, setSelectedStatus] = useState<"open" | "closed" | "fulfilled" | undefined>(
    undefined
  );
  const isAdmin = currentUser?.accountType === "admin";
  const rfqs = useQuery(api.admin.listAllRfqs, isAdmin ? { status: selectedStatus } : "skip");

  if (currentUser === undefined || rfqs === undefined) {
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

  const openRfqs = rfqs.filter((r) => r.status === "open");
  const closedRfqs = rfqs.filter((r) => r.status === "closed");
  const fulfilledRfqs = rfqs.filter((r) => r.status === "fulfilled");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">RFQ Monitoring</h1>
          <p className="text-muted-foreground">Monitor all RFQs on the platform</p>
        </div>
        <Link to="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      <Tabs
        defaultValue="all"
        onValueChange={(v) => {
          if (v === "all") setSelectedStatus(undefined);
          else setSelectedStatus(v as "open" | "closed" | "fulfilled");
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All ({rfqs.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({openRfqs.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedRfqs.length})</TabsTrigger>
          <TabsTrigger value="fulfilled">Fulfilled ({fulfilledRfqs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          <RfqTable rfqs={rfqs} />
        </TabsContent>
        <TabsContent value="open" className="space-y-4 mt-6">
          <RfqTable rfqs={openRfqs} />
        </TabsContent>
        <TabsContent value="closed" className="space-y-4 mt-6">
          <RfqTable rfqs={closedRfqs} />
        </TabsContent>
        <TabsContent value="fulfilled" className="space-y-4 mt-6">
          <RfqTable rfqs={fulfilledRfqs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RfqTable({ rfqs }: { rfqs: {
  _id: string;
  _creationTime: number;
  productName: string;
  hospitalName: string;
  categoryName: string;
  status: string;
  urgency: string;
  quantity: number;
  unit: string;
  deliveryLocation: string;
  specifications?: string;
  creatorName: string;
  quotationCount: number;
}[] }) {
  if (rfqs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">No RFQs found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rfqs.map((rfq) => (
        <Card key={rfq._id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{rfq.productName}</CardTitle>
                <CardDescription>
                  {rfq.hospitalName} • {rfq.categoryName}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge
                  variant={
                    rfq.status === "open"
                      ? "default"
                      : rfq.status === "fulfilled"
                        ? "default"
                        : "secondary"
                  }
                >
                  {rfq.status}
                </Badge>
                <Badge
                  variant={
                    rfq.urgency === "emergency"
                      ? "destructive"
                      : rfq.urgency === "urgent"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {rfq.urgency}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                <p className="text-sm">
                  {rfq.quantity} {rfq.unit}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Location</p>
                <p className="text-sm">{rfq.deliveryLocation}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created By</p>
                <p className="text-sm">{rfq.creatorName}</p>
              </div>
            </div>

            {rfq.specifications && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Specifications</p>
                <p className="text-sm">{rfq.specifications}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                {rfq.quotationCount} quotation{rfq.quotationCount !== 1 ? "s" : ""} received
              </div>
              <div className="text-xs text-muted-foreground">
                Created {new Date(rfq._creationTime).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
