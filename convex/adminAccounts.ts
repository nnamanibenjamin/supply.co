import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Setup admin hospital account
export const setupAdminHospital = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || user.accountType !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    // Check if admin already has a hospital
    if (user.hospitalId) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Admin hospital already exists",
      });
    }

    // Create hospital with admin flag
    const hospitalId = await ctx.db.insert("hospitals", {
      name: args.name,
      contactPerson: user.name || "Admin",
      email: args.email,
      phone: args.phone,
      hospitalCode: "ADMIN-" + Date.now(),
      verificationStatus: "approved",
      isAdminOwned: true,
      createdBy: user._id,
    });

    // Update user with hospitalId
    await ctx.db.patch(user._id, {
      hospitalId,
    });

    return { hospitalId };
  },
});

// Setup admin supplier account
export const setupAdminSupplier = mutation({
  args: {
    companyName: v.string(),
    email: v.string(),
    phone: v.string(),
    categories: v.array(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || user.accountType !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    // Check if admin already has a supplier
    if (user.supplierId) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Admin supplier already exists",
      });
    }

    // Create supplier with admin flag and unlimited credits
    const supplierId = await ctx.db.insert("suppliers", {
      companyName: args.companyName,
      contactPerson: user.name || "Admin",
      email: args.email,
      phone: args.phone,
      categories: args.categories,
      credits: 999999, // Unlimited credits
      verificationStatus: "approved",
      isActive: true,
      isAdminOwned: true,
      createdBy: user._id,
    });

    // Update user with supplierId
    await ctx.db.patch(user._id, {
      supplierId,
    });

    return { supplierId };
  },
});

// Get admin account info
export const getAdminAccounts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || user.accountType !== "admin") {
      return null;
    }

    let hospital = null;
    if (user.hospitalId) {
      hospital = await ctx.db.get(user.hospitalId);
    }

    let supplier = null;
    if (user.supplierId) {
      supplier = await ctx.db.get(user.supplierId);
    }

    return {
      hasHospital: !!hospital,
      hasSupplier: !!supplier,
      hospital,
      supplier,
    };
  },
});
