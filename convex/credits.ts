import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";

// Get active credit packages
export const getPackages = query({
  args: {},
  handler: async (ctx) => {
    const packages = await ctx.db
      .query("creditPackages")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();

    return packages.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// Get supplier's transaction history
export const getTransactionHistory = query({
  args: {
    supplierId: v.optional(v.id("suppliers")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be logged in to view transactions",
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

    let supplierId = args.supplierId;

    // If supplierId not provided, get from current user
    if (!supplierId) {
      if (user.accountType !== "supplier") {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Only suppliers can view credit transactions",
        });
      }

      if (!user.supplierId) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Supplier account not found",
        });
      }

      supplierId = user.supplierId;
    }

    // Verify user has access to this supplier
    if (user.accountType === "supplier" && user.supplierId !== supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot view other supplier's transactions",
      });
    }

    const transactions = await ctx.db
      .query("creditTransactions")
      .withIndex("by_supplier", (q) => q.eq("supplierId", supplierId))
      .order("desc")
      .collect();

    return transactions;
  },
});

// Get current credit balance
export const getCreditBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be logged in to view credit balance",
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

    if (user.accountType !== "supplier" || !user.supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only suppliers have credit balances",
      });
    }

    const supplier = await ctx.db.get(user.supplierId);
    if (!supplier) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Supplier not found",
      });
    }

    return {
      credits: supplier.credits,
      supplierId: supplier._id,
    };
  },
});

// Internal function to record a credit transaction
export const recordTransaction = internalMutation({
  args: {
    supplierId: v.id("suppliers"),
    type: v.union(
      v.literal("purchase"),
      v.literal("deduction"),
      v.literal("refund"),
      v.literal("admin_adjustment")
    ),
    amount: v.number(),
    description: v.string(),
    rfqId: v.optional(v.id("rfqs")),
    quotationId: v.optional(v.id("quotations")),
    packageId: v.optional(v.id("creditPackages")),
    processedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Supplier not found",
      });
    }

    // Calculate new balance
    const newBalance = supplier.credits + args.amount;

    // Update supplier balance
    await ctx.db.patch(args.supplierId, { credits: newBalance });

    // Record transaction
    await ctx.db.insert("creditTransactions", {
      supplierId: args.supplierId,
      type: args.type,
      amount: args.amount,
      balanceAfter: newBalance,
      description: args.description,
      rfqId: args.rfqId,
      quotationId: args.quotationId,
      packageId: args.packageId,
      processedBy: args.processedBy,
    });

    return { newBalance };
  },
});

// Initiate credit purchase (placeholder - in production would integrate with payment gateway)
export const initiatePurchase = mutation({
  args: {
    packageId: v.id("creditPackages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be logged in to purchase credits",
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

    if (user.accountType !== "supplier" || !user.supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only suppliers can purchase credits",
      });
    }

    if (user.verificationStatus !== "approved") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Your account must be verified before purchasing credits",
      });
    }

    const creditPackage = await ctx.db.get(args.packageId);
    if (!creditPackage || !creditPackage.isActive) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Credit package not found or inactive",
      });
    }

    // In production, this would:
    // 1. Create a payment intent with payment provider (M-Pesa, etc.)
    // 2. Return payment URL/details to frontend
    // 3. Handle webhook to confirm payment
    // 4. Call recordTransaction after successful payment

    // For now, return package details for the purchase flow
    return {
      packageId: creditPackage._id,
      credits: creditPackage.credits,
      priceKES: creditPackage.priceKES,
      name: creditPackage.name,
      // In production, would include: paymentUrl, reference, etc.
    };
  },
});

// Simulate credit purchase (for development/testing only - remove in production)
export const simulatePurchase = mutation({
  args: {
    packageId: v.id("creditPackages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be logged in to purchase credits",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.accountType !== "supplier" || !user.supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only suppliers can purchase credits",
      });
    }

    const creditPackage = await ctx.db.get(args.packageId);
    if (!creditPackage || !creditPackage.isActive) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Credit package not found",
      });
    }

    const supplier = await ctx.db.get(user.supplierId);
    if (!supplier) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Supplier not found",
      });
    }

    // Add credits immediately (simulating successful payment)
    const newBalance = supplier.credits + creditPackage.credits;
    await ctx.db.patch(user.supplierId, { credits: newBalance });

    // Record transaction
    await ctx.db.insert("creditTransactions", {
      supplierId: user.supplierId,
      type: "purchase",
      amount: creditPackage.credits,
      balanceAfter: newBalance,
      description: `Purchased ${creditPackage.name} (${creditPackage.credits} credits for KES ${creditPackage.priceKES})`,
      packageId: creditPackage._id,
      processedBy: user._id,
    });

    return {
      success: true,
      newBalance,
      creditsAdded: creditPackage.credits,
    };
  },
});
