import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// Get user's notifications
export const getNotifications = query({
  args: {
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be logged in to view notifications",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) =>
        args.unreadOnly
          ? q.eq("userId", user._id).eq("isRead", false)
          : q.eq("userId", user._id)
      )
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }

    return await query.collect();
  },
});

// Get unread count
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return 0;
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();

    return unreadNotifications.length;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be logged in to mark notifications as read",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Notification not found",
      });
    }

    if (notification.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot mark other user's notifications as read",
      });
    }

    await ctx.db.patch(args.notificationId, { isRead: true });

    return { success: true };
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be logged in to mark notifications as read",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id).eq("isRead", false))
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, { isRead: true });
    }

    return { success: true, count: unreadNotifications.length };
  },
});

// Internal function to create notification
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("new_rfq"),
      v.literal("quotation_submitted"),
      v.literal("quotation_accepted"),
      v.literal("quotation_rejected"),
      v.literal("rfq_closed"),
      v.literal("account_verified"),
      v.literal("account_rejected"),
      v.literal("low_credits")
    ),
    title: v.string(),
    message: v.string(),
    rfqId: v.optional(v.id("rfqs")),
    quotationId: v.optional(v.id("quotations")),
    metadata: v.optional(
      v.object({
        hospitalName: v.optional(v.string()),
        supplierName: v.optional(v.string()),
        productName: v.optional(v.string()),
        price: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      isRead: false,
      rfqId: args.rfqId,
      quotationId: args.quotationId,
      metadata: args.metadata,
    });
  },
});

// Internal function to notify suppliers about new RFQ
export const notifySuppliersAboutRFQ = internalMutation({
  args: {
    rfqId: v.id("rfqs"),
    categoryId: v.id("categories"),
    productName: v.string(),
    hospitalName: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all approved suppliers in this category
    const suppliers = await ctx.db.query("suppliers").collect();

    const category = await ctx.db.get(args.categoryId);

    for (const supplier of suppliers) {
      if (
        supplier.verificationStatus === "approved" &&
        supplier.isActive &&
        supplier.categories.includes(args.categoryId)
      ) {
        // Get supplier's users
        const supplierUsers = await ctx.db
          .query("users")
          .withIndex("by_supplier", (q) => q.eq("supplierId", supplier._id))
          .collect();

        for (const user of supplierUsers) {
          await ctx.db.insert("notifications", {
            userId: user._id,
            type: "new_rfq",
            title: "New RFQ Available",
            message: `${args.hospitalName} posted a new RFQ for ${args.productName} in ${category?.name || "your category"}`,
            isRead: false,
            rfqId: args.rfqId,
            metadata: {
              hospitalName: args.hospitalName,
              productName: args.productName,
            },
          });
        }
      }
    }
  },
});

// Internal function to notify hospital about new quotation
export const notifyHospitalAboutQuotation = internalMutation({
  args: {
    quotationId: v.id("quotations"),
    rfqId: v.id("rfqs"),
    hospitalId: v.id("hospitals"),
    supplierName: v.string(),
    productName: v.string(),
    totalPrice: v.number(),
  },
  handler: async (ctx, args) => {
    // Get hospital users
    const hospitalUsers = await ctx.db
      .query("users")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", args.hospitalId))
      .collect();

    for (const user of hospitalUsers) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "quotation_submitted",
        title: "New Quotation Received",
        message: `${args.supplierName} submitted a quotation for ${args.productName} - KES ${args.totalPrice.toLocaleString()}`,
        isRead: false,
        rfqId: args.rfqId,
        quotationId: args.quotationId,
        metadata: {
          supplierName: args.supplierName,
          productName: args.productName,
          price: args.totalPrice,
        },
      });
    }
  },
});

// Internal function to notify supplier about quotation status
export const notifySupplierAboutQuotationStatus = internalMutation({
  args: {
    quotationId: v.id("quotations"),
    supplierId: v.id("suppliers"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
    hospitalName: v.string(),
    productName: v.string(),
  },
  handler: async (ctx, args) => {
    // Get supplier users
    const supplierUsers = await ctx.db
      .query("users")
      .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId))
      .collect();

    const type =
      args.status === "accepted" ? "quotation_accepted" : "quotation_rejected";
    const title =
      args.status === "accepted"
        ? "Quotation Accepted!"
        : "Quotation Not Selected";
    const message =
      args.status === "accepted"
        ? `Congratulations! ${args.hospitalName} accepted your quotation for ${args.productName}. Check the details to contact them.`
        : `${args.hospitalName} did not select your quotation for ${args.productName}. Keep trying!`;

    for (const user of supplierUsers) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        type,
        title,
        message,
        isRead: false,
        quotationId: args.quotationId,
        metadata: {
          hospitalName: args.hospitalName,
          productName: args.productName,
        },
      });
    }
  },
});
