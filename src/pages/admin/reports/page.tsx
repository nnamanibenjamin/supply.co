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
} from "recharts";
import { useState } from "react";
import { DownloadIcon } from "lucide-react";

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

export default function AdminReportsPage() {
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
          <ReportsContent />
        </Authenticated>
      </div>
    </div>
  );
}

function ReportsContent() {
  const [timeRange, setTimeRange] = useState(30);
  const stats = useQuery(api.reports.getAdminDashboardStats);
  const timeline = useQuery(api.reports.getAdminActivityTimeline, { days: timeRange });
  const categoryPerf = useQuery(api.reports.getAdminCategoryPerformance);

  if (stats === undefined || timeline === undefined || categoryPerf === undefined) {
    return <Skeleton className="h-96 w-full" />;
  }

  const handleExportStats = () => {
    const data = [
      {
        Metric: "Total Users",
        Value: stats.totalUsers,
      },
      {
        Metric: "Recent Users (30 days)",
        Value: stats.recentUsers,
      },
      {
        Metric: "Total Hospitals",
        Value: stats.totalHospitals,
      },
      {
        Metric: "Total Suppliers",
        Value: stats.totalSuppliers,
      },
      {
        Metric: "Total RFQs",
        Value: stats.totalRfqs,
      },
      {
        Metric: "Open RFQs",
        Value: stats.openRfqs,
      },
      {
        Metric: "Closed RFQs",
        Value: stats.closedRfqs,
      },
      {
        Metric: "Fulfilled RFQs",
        Value: stats.fulfilledRfqs,
      },
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
        Metric: "Total Revenue (KES)",
        Value: stats.totalRevenue,
      },
    ];
    exportToCSV(data, `platform-stats-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportTimeline = () => {
    const data = timeline.map((item) => ({
      Date: item.date,
      RFQs: item.rfqs,
      Quotations: item.quotations,
      "Revenue (KES)": item.revenue,
    }));
    exportToCSV(data, `activity-timeline-${timeRange}days-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportCategories = () => {
    const data = categoryPerf.map((cat) => ({
      Category: cat.name,
      "RFQ Count": cat.rfqCount,
      "Quotation Count": cat.quotationCount,
      "Accepted Count": cat.acceptedCount,
      "Total Value (KES)": cat.totalValue,
    }));
    exportToCSV(data, `category-performance-${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Platform Reports</h1>
          <p className="text-muted-foreground">Analytics and insights for saline.co.ke</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportStats}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export Stats
          </Button>
          <Link to="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+{stats.recentUsers} in last 30 days</p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuotations}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.recentQuotations} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From credit purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
          <TabsTrigger value="categories">Category Performance</TabsTrigger>
          <TabsTrigger value="breakdown">Status Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Platform Activity</CardTitle>
                  <CardDescription>RFQs, Quotations, and Revenue over time</CardDescription>
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
                  <p>No platform activity in the selected time period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rfqs" stroke="#3b82f6" name="RFQs" />
                    <Line type="monotone" dataKey="quotations" stroke="#10b981" name="Quotations" />
                    <Line type="monotone" dataKey="revenue" stroke="#f59e0b" name="Revenue (KES)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>RFQs and quotations by category</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportCategories}>
                  <DownloadIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categoryPerf.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <p>No category data available yet</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={categoryPerf}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="rfqCount" fill="#3b82f6" name="RFQs" />
                      <Bar dataKey="quotationCount" fill="#10b981" name="Quotations" />
                      <Bar dataKey="acceptedCount" fill="#f59e0b" name="Accepted" />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </CardContent>
          </Card>

          {categoryPerf.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
            {categoryPerf.map((cat) => (
              <Card key={cat.name}>
                <CardHeader>
                  <CardTitle className="text-base">{cat.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total RFQs</span>
                    <span className="font-medium">{cat.rfqCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quotations</span>
                    <span className="font-medium">{cat.quotationCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accepted</span>
                    <span className="font-medium">{cat.acceptedCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value</span>
                    <span className="font-medium">KES {cat.totalValue.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>RFQ Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Open RFQs</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(stats.openRfqs / stats.totalRfqs) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.openRfqs}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Closed RFQs</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-500"
                          style={{
                            width: `${(stats.closedRfqs / stats.totalRfqs) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.closedRfqs}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fulfilled RFQs</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(stats.fulfilledRfqs / stats.totalRfqs) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.fulfilledRfqs}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quotation Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Quotations</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500"
                          style={{
                            width: `${(stats.pendingQuotations / stats.totalQuotations) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.pendingQuotations}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Accepted Quotations</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(stats.acceptedQuotations / stats.totalQuotations) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.acceptedQuotations}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Rejected Quotations</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{
                            width: `${(stats.rejectedQuotations / stats.totalQuotations) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.rejectedQuotations}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
