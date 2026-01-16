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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState } from "react";
import { DownloadIcon } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// Helper function to export data to CSV
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Handle values that might contain commas
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function DashboardReportsPage() {
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
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to view reports</CardDescription>
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
          <ReportsContent />
        </Authenticated>
      </div>
    </div>
  );
}

function ReportsContent() {
  const currentUser = useQuery(api.registration.getCurrentUser);

  if (currentUser === undefined) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!currentUser) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            You need to complete your registration to access reports
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link to="/signup">
            <Button>Complete Registration</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (currentUser.accountType === "hospital" || currentUser.accountType === "hospital_staff") {
    return <HospitalReports />;
  }

  if (currentUser.accountType === "supplier") {
    return <SupplierReports />;
  }

  if (currentUser.accountType === "admin") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Admin Reports</CardTitle>
          <CardDescription>Access admin reports from the admin panel</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link to="/admin/reports">
            <Button>Go to Admin Reports</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return null;
}

function HospitalReports() {
  const [timeRange, setTimeRange] = useState(30);
  const stats = useQuery(api.reports.getHospitalDashboardStats);
  const spendingByCategory = useQuery(api.reports.getHospitalSpendingByCategory);
  const timeline = useQuery(api.reports.getHospitalRfqTimeline, { days: timeRange });

  if (stats === undefined || spendingByCategory === undefined || timeline === undefined) {
    return <Skeleton className="h-96 w-full" />;
  }

  const handleExportStats = () => {
    const data = [
      {
        Metric: "Total RFQs",
        Value: stats.totalRfqs,
      },
      {
        Metric: "Active RFQs",
        Value: stats.activeRfqs,
      },
      {
        Metric: "Fulfilled RFQs",
        Value: stats.fulfilledRfqs,
      },
      {
        Metric: "Total Spending (KES)",
        Value: stats.totalSpending,
      },
      {
        Metric: "Total Quotations",
        Value: stats.totalQuotations,
      },
      {
        Metric: "Accepted Quotations",
        Value: stats.acceptedQuotations,
      },
      {
        Metric: "Avg Quotations per RFQ",
        Value: stats.avgQuotationsPerRfq,
      },
    ];
    exportToCSV(data, `hospital-stats-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportSpending = () => {
    const data = spendingByCategory.map((cat) => ({
      Category: cat.name,
      "RFQ Count": cat.rfqCount,
      "Total Spending (KES)": cat.spending,
      "Avg per RFQ (KES)": cat.rfqCount > 0 ? Math.round(cat.spending / cat.rfqCount) : 0,
    }));
    exportToCSV(data, `spending-by-category-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportTimeline = () => {
    const data = timeline.map((item) => ({
      Date: item.date,
      "RFQs Created": item.created,
      "RFQs Fulfilled": item.fulfilled,
    }));
    exportToCSV(data, `rfq-timeline-${timeRange}days-${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Hospital Reports</h1>
          <p className="text-muted-foreground">Your RFQ performance and spending analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportStats}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export Stats
          </Button>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRfqs}</div>
            <p className="text-xs text-muted-foreground">+{stats.recentRfqs} in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active RFQs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRfqs}</div>
            <p className="text-xs text-muted-foreground">Currently open</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fulfilled RFQs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fulfilledRfqs}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.totalSpending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From {stats.acceptedQuotations} accepted quotes</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quotation Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Quotations Received</span>
              <span className="font-medium">{stats.totalQuotations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Accepted Quotations</span>
              <span className="font-medium">{stats.acceptedQuotations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Quotations per RFQ</span>
              <span className="font-medium">{stats.avgQuotationsPerRfq}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fulfillment Rate</span>
              <span className="font-medium">
                {stats.totalRfqs > 0
                  ? Math.round((stats.fulfilledRfqs / stats.totalRfqs) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Acceptance Rate</span>
              <span className="font-medium">
                {stats.totalQuotations > 0
                  ? Math.round((stats.acceptedQuotations / stats.totalQuotations) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Spending per RFQ</span>
              <span className="font-medium">
                KES{" "}
                {stats.totalRfqs > 0
                  ? Math.round(stats.totalSpending / stats.totalRfqs).toLocaleString()
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">RFQ Timeline</TabsTrigger>
          <TabsTrigger value="spending">Spending by Category</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>RFQ Activity Over Time</CardTitle>
                  <CardDescription>Track your RFQ creation and fulfillment</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportTimeline}>
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={timeRange === 7 ? "default" : "outline"}
                    onClick={() => setTimeRange(7)}
                  >
                    7 Days
                  </Button>
                  <Button
                    size="sm"
                    variant={timeRange === 30 ? "default" : "outline"}
                    onClick={() => setTimeRange(30)}
                  >
                    30 Days
                  </Button>
                  <Button
                    size="sm"
                    variant={timeRange === 90 ? "default" : "outline"}
                    onClick={() => setTimeRange(90)}
                  >
                    90 Days
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  <p>No RFQ activity in the selected time period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="created" stroke="#3b82f6" name="RFQs Created" />
                    <Line
                      type="monotone"
                      dataKey="fulfilled"
                      stroke="#10b981"
                      name="RFQs Fulfilled"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spending" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={handleExportSpending}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export Category Data
            </Button>
          </div>
          {spendingByCategory.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium mb-2">No spending data yet</p>
                  <p className="text-sm">Create RFQs and accept quotations to see spending analytics</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                    <CardDescription>Your procurement spending breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      dataKey="spending"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {spendingByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>RFQ count and spending per category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={spendingByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rfqCount" fill="#3b82f6" name="RFQ Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {spendingByCategory.map((cat, index) => (
              <Card key={cat.name}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {cat.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total RFQs</span>
                    <span className="font-medium">{cat.rfqCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Spending</span>
                    <span className="font-medium">KES {cat.spending.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg per RFQ</span>
                    <span className="font-medium">
                      KES{" "}
                      {cat.rfqCount > 0
                        ? Math.round(cat.spending / cat.rfqCount).toLocaleString()
                        : 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SupplierReports() {
  const [timeRange, setTimeRange] = useState(30);
  const stats = useQuery(api.reports.getSupplierDashboardStats);
  const revenueByCategory = useQuery(api.reports.getSupplierRevenueByCategory);
  const timeline = useQuery(api.reports.getSupplierQuotationTimeline, { days: timeRange });

  if (stats === undefined || revenueByCategory === undefined || timeline === undefined) {
    return <Skeleton className="h-96 w-full" />;
  }

  const handleExportStats = () => {
    const data = [
      {
        Metric: "Total Quotations",
        Value: stats.totalQuotations,
      },
      {
        Metric: "Pending Quotations",
        Value: stats.pendingQuotations,
      },
      {
        Metric: "Accepted Quotations",
        Value: stats.acceptedQuotations,
      },
      {
        Metric: "Rejected Quotations",
        Value: stats.rejectedQuotations,
      },
      {
        Metric: "Win Rate (%)",
        Value: stats.winRate,
      },
      {
        Metric: "Total Revenue (KES)",
        Value: stats.totalRevenue,
      },
      {
        Metric: "Credit Balance",
        Value: stats.creditBalance,
      },
      {
        Metric: "Credits Purchased",
        Value: stats.totalCreditsPurchased,
      },
      {
        Metric: "Credits Spent",
        Value: stats.totalCreditsSpent,
      },
    ];
    exportToCSV(data, `supplier-stats-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportRevenue = () => {
    const data = revenueByCategory.map((cat) => ({
      Category: cat.name,
      "Accepted Quotations": cat.count,
      "Total Revenue (KES)": cat.revenue,
      "Avg per Quote (KES)": cat.count > 0 ? Math.round(cat.revenue / cat.count) : 0,
    }));
    exportToCSV(data, `revenue-by-category-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportTimeline = () => {
    const data = timeline.map((item) => ({
      Date: item.date,
      Submitted: item.submitted,
      Accepted: item.accepted,
      Rejected: item.rejected,
    }));
    exportToCSV(data, `quotation-timeline-${timeRange}days-${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Supplier Reports</h1>
          <p className="text-muted-foreground">Your quotation performance and revenue analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportStats}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export Stats
          </Button>
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotations}</div>
            <p className="text-xs text-muted-foreground">+{stats.recentQuotations} in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.acceptedQuotations} accepted out of {stats.totalQuotations}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From accepted quotations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.creditBalance}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCreditsPurchased} purchased, {stats.totalCreditsSpent} spent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quotation Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium">{stats.pendingQuotations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Accepted</span>
              <span className="font-medium text-green-600">{stats.acceptedQuotations}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rejected</span>
              <span className="font-medium text-red-600">{stats.rejectedQuotations}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Revenue per Quote</span>
              <span className="font-medium">
                KES{" "}
                {stats.acceptedQuotations > 0
                  ? Math.round(stats.totalRevenue / stats.acceptedQuotations).toLocaleString()
                  : 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Value Quoted</span>
              <span className="font-medium">KES {stats.totalRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credit Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Credits Purchased</span>
              <span className="font-medium">{stats.totalCreditsPurchased}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Credits Spent</span>
              <span className="font-medium">{stats.totalCreditsSpent}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="font-medium">{stats.creditBalance}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Quotation Timeline</TabsTrigger>
          <TabsTrigger value="revenue">Revenue by Category</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quotation Activity Over Time</CardTitle>
                  <CardDescription>Track your quotation submissions and success</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportTimeline}>
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={timeRange === 7 ? "default" : "outline"}
                    onClick={() => setTimeRange(7)}
                  >
                    7 Days
                  </Button>
                  <Button
                    size="sm"
                    variant={timeRange === 30 ? "default" : "outline"}
                    onClick={() => setTimeRange(30)}
                  >
                    30 Days
                  </Button>
                  <Button
                    size="sm"
                    variant={timeRange === 90 ? "default" : "outline"}
                    onClick={() => setTimeRange(90)}
                  >
                    90 Days
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  <p>No quotation activity in the selected time period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="submitted"
                      stroke="#3b82f6"
                      name="Submitted"
                    />
                    <Line type="monotone" dataKey="accepted" stroke="#10b981" name="Accepted" />
                    <Line type="monotone" dataKey="rejected" stroke="#ef4444" name="Rejected" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={handleExportRevenue}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export Revenue Data
            </Button>
          </div>
          {revenueByCategory.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium mb-2">No revenue data yet</p>
                  <p className="text-sm">Submit quotations and win RFQs to see revenue analytics</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Category</CardTitle>
                    <CardDescription>Your earnings breakdown by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueByCategory}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {revenueByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Accepted quotations per category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Accepted Quotes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {revenueByCategory.map((cat, index) => (
              <Card key={cat.name}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {cat.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accepted Quotations</span>
                    <span className="font-medium">{cat.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="font-medium">KES {cat.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg per Quote</span>
                    <span className="font-medium">
                      KES {cat.count > 0 ? Math.round(cat.revenue / cat.count).toLocaleString() : 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
