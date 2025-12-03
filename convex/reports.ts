import { ConvexError } from "convex/values";
import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v } from "convex/values";

// Helper to check if user is authorized
async function getAuthorizedUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Must be signed in",
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
  return user;
}

// Admin Reports
export const getAdminDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthorizedUser(ctx);
    if (user.accountType !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Get all data
    const allUsers = await ctx.db.query("users").collect();
    const allHospitals = await ctx.db.query("hospitals").collect();
    const allSuppliers = await ctx.db.query("suppliers").collect();
    const allRfqs = await ctx.db.query("rfqs").collect();
    const allQuotations = await ctx.db.query("quotations").collect();
    const allTransactions = await ctx.db.query("creditTransactions").collect();

    // Calculate totals
    const totalUsers = allUsers.length;
    const totalHospitals = allHospitals.length;
    const totalSuppliers = allSuppliers.length;
    const totalRfqs = allRfqs.length;
    const totalQuotations = allQuotations.length;

    // Recent activity (last 30 days)
    const recentUsers = allUsers.filter((u) => u._creationTime > thirtyDaysAgo).length;
    const recentRfqs = allRfqs.filter((r) => r._creationTime > thirtyDaysAgo).length;
    const recentQuotations = allQuotations.filter((q) => q._creationTime > thirtyDaysAgo).length;

    // RFQ status breakdown
    const openRfqs = allRfqs.filter((r) => r.status === "open").length;
    const closedRfqs = allRfqs.filter((r) => r.status === "closed").length;
    const fulfilledRfqs = allRfqs.filter((r) => r.status === "fulfilled").length;

    // Quotation status breakdown
    const pendingQuotations = allQuotations.filter((q) => q.status === "pending").length;
    const acceptedQuotations = allQuotations.filter((q) => q.status === "accepted").length;
    const rejectedQuotations = allQuotations.filter((q) => q.status === "rejected").length;

    // Credit purchases (revenue)
    const totalRevenue = allTransactions
      .filter((t) => t.type === "purchase")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalUsers,
      totalHospitals,
      totalSuppliers,
      totalRfqs,
      totalQuotations,
      recentUsers,
      recentRfqs,
      recentQuotations,
      openRfqs,
      closedRfqs,
      fulfilledRfqs,
      pendingQuotations,
      acceptedQuotations,
      rejectedQuotations,
      totalRevenue,
    };
  },
});

export const getAdminActivityTimeline = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const user = await getAuthorizedUser(ctx);
    if (user.accountType !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const startTime = Date.now() - args.days * 24 * 60 * 60 * 1000;

    const allRfqs = await ctx.db.query("rfqs").collect();
    const allQuotations = await ctx.db.query("quotations").collect();
    const allTransactions = await ctx.db.query("creditTransactions").collect();

    // Group by day
    const timeline: Record<string, { date: string; rfqs: number; quotations: number; revenue: number }> = {};

    // Process RFQs
    allRfqs
      .filter((r) => r._creationTime > startTime)
      .forEach((rfq) => {
        const date = new Date(rfq._creationTime).toISOString().split("T")[0];
        if (!timeline[date]) {
          timeline[date] = { date, rfqs: 0, quotations: 0, revenue: 0 };
        }
        timeline[date].rfqs++;
      });

    // Process Quotations
    allQuotations
      .filter((q) => q._creationTime > startTime)
      .forEach((quotation) => {
        const date = new Date(quotation._creationTime).toISOString().split("T")[0];
        if (!timeline[date]) {
          timeline[date] = { date, rfqs: 0, quotations: 0, revenue: 0 };
        }
        timeline[date].quotations++;
      });

    // Process Revenue
    allTransactions
      .filter((t) => t.type === "purchase" && t._creationTime > startTime)
      .forEach((transaction) => {
        const date = new Date(transaction._creationTime).toISOString().split("T")[0];
        if (!timeline[date]) {
          timeline[date] = { date, rfqs: 0, quotations: 0, revenue: 0 };
        }
        timeline[date].revenue += transaction.amount;
      });

    return Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getAdminCategoryPerformance = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthorizedUser(ctx);
    if (user.accountType !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const categories = await ctx.db.query("categories").collect();
    const allRfqs = await ctx.db.query("rfqs").collect();
    const allQuotations = await ctx.db.query("quotations").collect();

    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const categoryRfqs = allRfqs.filter((r) => r.categoryId === category._id);
        const rfqIds = categoryRfqs.map((r) => r._id);
        const categoryQuotations = allQuotations.filter((q) => rfqIds.includes(q.rfqId));
        const acceptedQuotations = categoryQuotations.filter((q) => q.status === "accepted");

        return {
          name: category.name,
          rfqCount: categoryRfqs.length,
          quotationCount: categoryQuotations.length,
          acceptedCount: acceptedQuotations.length,
          totalValue: acceptedQuotations.reduce((sum, q) => sum + q.totalPrice, 0),
        };
      })
    );

    return categoryStats.sort((a, b) => b.rfqCount - a.rfqCount);
  },
});

// Hospital Reports
export const getHospitalDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthorizedUser(ctx);
    if (!user.hospitalId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Hospital access required",
      });
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const allRfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", user.hospitalId!))
      .collect();

    const rfqIds = allRfqs.map((r) => r._id);
    const allQuotations = await Promise.all(
      rfqIds.map((id) =>
        ctx.db
          .query("quotations")
          .withIndex("by_rfq", (q) => q.eq("rfqId", id))
          .collect()
      )
    );
    const quotations = allQuotations.flat();

    const totalRfqs = allRfqs.length;
    const activeRfqs = allRfqs.filter((r) => r.status === "open").length;
    const fulfilledRfqs = allRfqs.filter((r) => r.status === "fulfilled").length;
    const recentRfqs = allRfqs.filter((r) => r._creationTime > thirtyDaysAgo).length;

    const totalQuotations = quotations.length;
    const acceptedQuotations = quotations.filter((q) => q.status === "accepted").length;
    const totalSpending = quotations
      .filter((q) => q.status === "accepted")
      .reduce((sum, q) => sum + q.totalPrice, 0);

    const avgQuotationsPerRfq = totalRfqs > 0 ? totalQuotations / totalRfqs : 0;

    return {
      totalRfqs,
      activeRfqs,
      fulfilledRfqs,
      recentRfqs,
      totalQuotations,
      acceptedQuotations,
      totalSpending,
      avgQuotationsPerRfq: Math.round(avgQuotationsPerRfq * 10) / 10,
    };
  },
});

export const getHospitalSpendingByCategory = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthorizedUser(ctx);
    if (!user.hospitalId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Hospital access required",
      });
    }

    const allRfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", user.hospitalId!))
      .collect();

    const rfqIds = allRfqs.map((r) => r._id);
    const allQuotations = await Promise.all(
      rfqIds.map((id) =>
        ctx.db
          .query("quotations")
          .withIndex("by_rfq", (q) => q.eq("rfqId", id))
          .collect()
      )
    );
    const quotations = allQuotations.flat();

    const categoryMap: Record<string, { name: string; spending: number; rfqCount: number }> = {};

    await Promise.all(
      allRfqs.map(async (rfq) => {
        const category = await ctx.db.get(rfq.categoryId);
        if (!category) return;

        if (!categoryMap[category._id]) {
          categoryMap[category._id] = { name: category.name, spending: 0, rfqCount: 0 };
        }
        categoryMap[category._id].rfqCount++;

        const rfqQuotations = quotations.filter(
          (q) => q.rfqId === rfq._id && q.status === "accepted"
        );
        const spending = rfqQuotations.reduce((sum, q) => sum + q.totalPrice, 0);
        categoryMap[category._id].spending += spending;
      })
    );

    return Object.values(categoryMap).sort((a, b) => b.spending - a.spending);
  },
});

export const getHospitalRfqTimeline = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const user = await getAuthorizedUser(ctx);
    if (!user.hospitalId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Hospital access required",
      });
    }

    const startTime = Date.now() - args.days * 24 * 60 * 60 * 1000;

    const allRfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", user.hospitalId!))
      .collect();

    const timeline: Record<string, { date: string; created: number; fulfilled: number }> = {};

    allRfqs
      .filter((r) => r._creationTime > startTime)
      .forEach((rfq) => {
        const date = new Date(rfq._creationTime).toISOString().split("T")[0];
        if (!timeline[date]) {
          timeline[date] = { date, created: 0, fulfilled: 0 };
        }
        timeline[date].created++;
        if (rfq.status === "fulfilled") {
          timeline[date].fulfilled++;
        }
      });

    return Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Supplier Reports
export const getSupplierDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthorizedUser(ctx);
    if (!user.supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Supplier access required",
      });
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const supplier = await ctx.db.get(user.supplierId);

    const allQuotations = await ctx.db
      .query("quotations")
      .withIndex("by_supplier", (q) => q.eq("supplierId", user.supplierId!))
      .collect();

    const totalQuotations = allQuotations.length;
    const pendingQuotations = allQuotations.filter((q) => q.status === "pending").length;
    const acceptedQuotations = allQuotations.filter((q) => q.status === "accepted").length;
    const rejectedQuotations = allQuotations.filter((q) => q.status === "rejected").length;
    const recentQuotations = allQuotations.filter((q) => q._creationTime > thirtyDaysAgo).length;

    const winRate =
      totalQuotations > 0
        ? Math.round((acceptedQuotations / totalQuotations) * 100 * 10) / 10
        : 0;

    const totalRevenue = allQuotations
      .filter((q) => q.status === "accepted")
      .reduce((sum, q) => sum + q.totalPrice, 0);

    const creditBalance = supplier?.credits || 0;

    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_supplier", (q) => q.eq("supplierId", user.supplierId!))
      .collect();

    const totalCreditsPurchased = transactions
      .filter((t) => t.type === "purchase")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCreditsSpent = transactions
      .filter((t) => t.type === "deduction")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      totalQuotations,
      pendingQuotations,
      acceptedQuotations,
      rejectedQuotations,
      recentQuotations,
      winRate,
      totalRevenue,
      creditBalance,
      totalCreditsPurchased,
      totalCreditsSpent,
    };
  },
});

export const getSupplierQuotationTimeline = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const user = await getAuthorizedUser(ctx);
    if (!user.supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Supplier access required",
      });
    }

    const startTime = Date.now() - args.days * 24 * 60 * 60 * 1000;

    const allQuotations = await ctx.db
      .query("quotations")
      .withIndex("by_supplier", (q) => q.eq("supplierId", user.supplierId!))
      .collect();

    const timeline: Record<
      string,
      { date: string; submitted: number; accepted: number; rejected: number }
    > = {};

    allQuotations
      .filter((q) => q._creationTime > startTime)
      .forEach((quotation) => {
        const date = new Date(quotation._creationTime).toISOString().split("T")[0];
        if (!timeline[date]) {
          timeline[date] = { date, submitted: 0, accepted: 0, rejected: 0 };
        }
        timeline[date].submitted++;
        if (quotation.status === "accepted") {
          timeline[date].accepted++;
        } else if (quotation.status === "rejected") {
          timeline[date].rejected++;
        }
      });

    return Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getSupplierRevenueByCategory = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthorizedUser(ctx);
    if (!user.supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Supplier access required",
      });
    }

    const allQuotations = await ctx.db
      .query("quotations")
      .withIndex("by_supplier", (q) => q.eq("supplierId", user.supplierId!))
      .collect();

    const acceptedQuotations = allQuotations.filter((q) => q.status === "accepted");

    const categoryMap: Record<string, { name: string; revenue: number; count: number }> = {};

    await Promise.all(
      acceptedQuotations.map(async (quotation) => {
        const rfq = await ctx.db.get(quotation.rfqId);
        if (!rfq) return;

        const category = await ctx.db.get(rfq.categoryId);
        if (!category) return;

        if (!categoryMap[category._id]) {
          categoryMap[category._id] = { name: category.name, revenue: 0, count: 0 };
        }
        categoryMap[category._id].revenue += quotation.totalPrice;
        categoryMap[category._id].count++;
      })
    );

    return Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);
  },
});
