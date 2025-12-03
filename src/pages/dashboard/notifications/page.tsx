import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { BellIcon, CheckIcon } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import { NotificationsBell } from "@/components/notifications-bell.tsx";

export default function NotificationsPage() {
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
          <div className="flex items-center gap-2">
            <Authenticated>
              <NotificationsBell />
            </Authenticated>
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Unauthenticated>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to view your notifications</CardDescription>
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
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </AuthLoading>

        <Authenticated>
          <NotificationsContent />
        </Authenticated>
      </div>
    </div>
  );
}

function NotificationsContent() {
  const notifications = useQuery(api.notifications.getNotifications, {});
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  if (notifications === undefined) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-32 w-full" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  const getNotificationLink = (notification: (typeof notifications)[0]) => {
    if (notification.type === "new_rfq" && notification.rfqId) {
      return `/dashboard/supplier-rfqs`;
    }
    if (notification.type === "quotation_submitted" && notification.rfqId) {
      return `/dashboard/rfqs/${notification.rfqId}`;
    }
    if (
      (notification.type === "quotation_accepted" || notification.type === "quotation_rejected") &&
      notification.quotationId
    ) {
      return `/dashboard/quotations/${notification.quotationId}`;
    }
    return "/dashboard";
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "quotation_accepted":
        return "✅";
      case "quotation_rejected":
        return "❌";
      case "new_rfq":
        return "📋";
      case "quotation_submitted":
        return "💼";
      case "rfq_closed":
        return "🚫";
      case "account_verified":
        return "✅";
      case "account_rejected":
        return "❌";
      case "low_credits":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "quotation_accepted":
      case "account_verified":
        return "bg-green-100 dark:bg-green-950";
      case "quotation_rejected":
      case "account_rejected":
      case "rfq_closed":
        return "bg-red-100 dark:bg-red-950";
      case "low_credits":
        return "bg-yellow-100 dark:bg-yellow-950";
      case "new_rfq":
      case "quotation_submitted":
        return "bg-blue-100 dark:bg-blue-950";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your RFQs and quotations</p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckIcon className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BellIcon />
            </EmptyMedia>
            <EmptyTitle>No notifications yet</EmptyTitle>
            <EmptyDescription>
              You'll receive notifications about RFQs, quotations, and account updates here
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`${!notification.isRead ? "border-primary/50" : ""}`}
            >
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div
                    className={`h-12 w-12 rounded-full ${getTypeColor(
                      notification.type
                    )} flex items-center justify-center text-2xl flex-shrink-0`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{notification.title}</h3>
                        {!notification.isRead && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(notification._creationTime).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification._id)}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-3">{notification.message}</p>
                    <Link to={getNotificationLink(notification)}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
