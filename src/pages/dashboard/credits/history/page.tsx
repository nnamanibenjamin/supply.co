import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Link } from "react-router-dom";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty.tsx";
import { ArrowDownIcon, ArrowUpIcon, HistoryIcon } from "lucide-react";

export default function TransactionHistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold">saline.co.ke</span>
          </Link>
          <Link to="/dashboard/credits">
            <Button variant="ghost">Back to Credits</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Unauthenticated>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to view transaction history</CardDescription>
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
            <Skeleton className="h-32 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </AuthLoading>

        <Authenticated>
          <TransactionHistoryContent />
        </Authenticated>
      </div>
    </div>
  );
}

function TransactionHistoryContent() {
  const currentUser = useQuery(api.registration.getCurrentUser);
  const transactions = useQuery(api.credits.getTransactionHistory, {});

  if (currentUser === undefined || transactions === undefined) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-32 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!currentUser || currentUser.accountType !== "supplier") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Suppliers Only</CardTitle>
          <CardDescription>
            Only suppliers can view credit transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "default";
      case "deduction":
        return "destructive";
      case "refund":
        return "default";
      case "admin_adjustment":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "purchase":
        return "Purchase";
      case "deduction":
        return "Deduction";
      case "refund":
        return "Refund";
      case "admin_adjustment":
        return "Admin Adjustment";
      default:
        return type;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
        <p className="text-muted-foreground">
          View all your credit transactions
        </p>
      </div>

      {transactions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HistoryIcon />
            </EmptyMedia>
            <EmptyTitle>No transactions yet</EmptyTitle>
            <EmptyDescription>
              Your credit transaction history will appear here
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/dashboard/credits">
              <Button size="sm">Purchase Credits</Button>
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              {transactions.length} {transactions.length === 1 ? "transaction" : "transactions"} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`mt-1 p-2 rounded-full ${
                      transaction.amount > 0 
                        ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    }`}>
                      {transaction.amount > 0 ? (
                        <ArrowUpIcon className="h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getTransactionTypeColor(transaction.type)}>
                          {getTransactionTypeLabel(transaction.type)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(transaction._creationTime).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Balance after: {transaction.balanceAfter} credits
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-lg font-bold ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                    </div>
                    <div className="text-xs text-muted-foreground">credits</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
