import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { BellIcon, CheckIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const notifications = useQuery(api.notifications.getNotifications, { limit: 5 });
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

  const getNotificationLink = (notification: NonNullable<typeof notifications>[0]) => {
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
      default:
        return "🔔";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount !== undefined && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {notifications && notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <CheckIcon className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications === undefined ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <Link
                  key={notification._id}
                  to={getNotificationLink(notification)}
                  onClick={() => {
                    if (!notification.isRead) {
                      handleMarkAsRead(notification._id);
                    }
                    setOpen(false);
                  }}
                  className={`block p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.isRead && (
                          <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification._creationTime).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        {notifications && notifications.length > 0 && (
          <div className="p-2 border-t">
            <Link to="/dashboard/notifications" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full text-sm">
                View all notifications
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
