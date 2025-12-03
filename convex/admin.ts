import { ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// Helper to check if user is admin
async function ensureAdmin(ctx: QueryCtx | MutationCtx) {
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
  if (!user || user.accountType !== "admin") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return user;
}

// Statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await ensureAdmin(ctx);

    const pendingHospitals = await ctx.db
      .query("hospitals")
      .withIndex("by_verification_status", (q) => q.eq("verificationStatus", "pending"))
      .collect();

    const pendingSuppliers = await ctx.db
      .query("suppliers")
      .withIndex("by_verification_status", (q) => q.eq("verificationStatus", "pending"))
      .collect();

    const openRfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const totalUsers = await ctx.db.query("users").collect();
    const totalHospitals = await ctx.db.query("hospitals").collect();
    const totalSuppliers = await ctx.db.query("suppliers").collect();

    return {
      pendingHospitals: pendingHospitals.length,
      pendingSuppliers: pendingSuppliers.length,
      openRfqs: openRfqs.length,
      totalUsers: totalUsers.length,
      totalHospitals: totalHospitals.length,
      totalSuppliers: totalSuppliers.length,
    };
  },
});

// Hospital Management
export const listHospitals = query({
  args: { status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))) },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);

    const hospitals = args.status
      ? await ctx.db
          .query("hospitals")
          .withIndex("by_verification_status", (q) => q.eq("verificationStatus", args.status!))
          .collect()
      : await ctx.db.query("hospitals").collect();

    // Fetch created by users and license URLs
    const hospitalsWithDetails = await Promise.all(
      hospitals.map(async (hospital) => {
        const creator = await ctx.db.get(hospital.createdBy);
        let licenseUrl = null;
        if (hospital.medicalLicenseStorageId) {
          licenseUrl = await ctx.storage.getUrl(hospital.medicalLicenseStorageId);
        }
        return {
          ...hospital,
          creatorName: creator?.name || "Unknown",
          creatorEmail: creator?.email || "Unknown",
          licenseUrl,
        };
      })
    );

    return hospitalsWithDetails;
  },
});

export const approveHospital = mutation({
  args: { hospitalId: v.id("hospitals") },
  handler: async (ctx, args) => {
    const admin = await ensureAdmin(ctx);

    const hospital = await ctx.db.get(args.hospitalId);
    if (!hospital) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hospital not found",
      });
    }

    // Update hospital status
    await ctx.db.patch(args.hospitalId, {
      verificationStatus: "approved",
    });

    // Update creator user status
    const creator = await ctx.db.get(hospital.createdBy);
    if (creator) {
      await ctx.db.patch(hospital.createdBy, {
        verificationStatus: "approved",
      });

      // Create notification for user
      await ctx.db.insert("notifications", {
        userId: hospital.createdBy,
        type: "account_verified",
        title: "Hospital Account Approved",
        message: `Your hospital "${hospital.name}" has been approved by our admin team.`,
        isRead: false,
      });
    }

    return { success: true };
  },
});

export const rejectHospital = mutation({
  args: { hospitalId: v.id("hospitals"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await ensureAdmin(ctx);

    const hospital = await ctx.db.get(args.hospitalId);
    if (!hospital) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hospital not found",
      });
    }

    // Update hospital status
    await ctx.db.patch(args.hospitalId, {
      verificationStatus: "rejected",
    });

    // Update creator user status
    const creator = await ctx.db.get(hospital.createdBy);
    if (creator) {
      await ctx.db.patch(hospital.createdBy, {
        verificationStatus: "rejected",
      });

      // Create notification for user
      await ctx.db.insert("notifications", {
        userId: hospital.createdBy,
        type: "account_rejected",
        title: "Hospital Account Rejected",
        message: args.reason || `Your hospital registration has been reviewed and could not be approved. Please contact support for more information.`,
        isRead: false,
      });
    }

    return { success: true };
  },
});

// Supplier Management
export const listSuppliers = query({
  args: { status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))) },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);

    const suppliers = args.status
      ? await ctx.db
          .query("suppliers")
          .withIndex("by_verification_status", (q) => q.eq("verificationStatus", args.status!))
          .collect()
      : await ctx.db.query("suppliers").collect();

    // Fetch created by users and CR12 URLs
    const suppliersWithDetails = await Promise.all(
      suppliers.map(async (supplier) => {
        const creator = await ctx.db.get(supplier.createdBy);
        let cr12Url = null;
        if (supplier.cr12StorageId) {
          cr12Url = await ctx.storage.getUrl(supplier.cr12StorageId);
        }

        // Get category names
        const categories = await Promise.all(
          supplier.categories.map(async (catId) => {
            const cat = await ctx.db.get(catId);
            return cat?.name || "Unknown";
          })
        );

        return {
          ...supplier,
          creatorName: creator?.name || "Unknown",
          creatorEmail: creator?.email || "Unknown",
          cr12Url,
          categoryNames: categories,
        };
      })
    );

    return suppliersWithDetails;
  },
});

export const approveSupplier = mutation({
  args: { supplierId: v.id("suppliers") },
  handler: async (ctx, args) => {
    const admin = await ensureAdmin(ctx);

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Supplier not found",
      });
    }

    // Update supplier status
    await ctx.db.patch(args.supplierId, {
      verificationStatus: "approved",
    });

    // Update creator user status
    const creator = await ctx.db.get(supplier.createdBy);
    if (creator) {
      await ctx.db.patch(supplier.createdBy, {
        verificationStatus: "approved",
      });

      // Create notification for user
      await ctx.db.insert("notifications", {
        userId: supplier.createdBy,
        type: "account_verified",
        title: "Supplier Account Approved",
        message: `Your supplier account "${supplier.companyName}" has been approved by our admin team.`,
        isRead: false,
      });
    }

    return { success: true };
  },
});

export const rejectSupplier = mutation({
  args: { supplierId: v.id("suppliers"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await ensureAdmin(ctx);

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Supplier not found",
      });
    }

    // Update supplier status
    await ctx.db.patch(args.supplierId, {
      verificationStatus: "rejected",
    });

    // Update creator user status
    const creator = await ctx.db.get(supplier.createdBy);
    if (creator) {
      await ctx.db.patch(supplier.createdBy, {
        verificationStatus: "rejected",
      });

      // Create notification for user
      await ctx.db.insert("notifications", {
        userId: supplier.createdBy,
        type: "account_rejected",
        title: "Supplier Account Rejected",
        message: args.reason || `Your supplier registration has been reviewed and could not be approved. Please contact support for more information.`,
        isRead: false,
      });
    }

    return { success: true };
  },
});

// Credit Package Management
export const listAllCreditPackages = query({
  args: {},
  handler: async (ctx) => {
    await ensureAdmin(ctx);
    return await ctx.db.query("creditPackages").order("asc").collect();
  },
});

export const createCreditPackage = mutation({
  args: {
    name: v.string(),
    credits: v.number(),
    priceKES: v.number(),
    description: v.optional(v.string()),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);

    const packageId = await ctx.db.insert("creditPackages", {
      name: args.name,
      credits: args.credits,
      priceKES: args.priceKES,
      description: args.description,
      displayOrder: args.displayOrder,
      isActive: true,
    });

    return packageId;
  },
});

export const updateCreditPackage = mutation({
  args: {
    packageId: v.id("creditPackages"),
    name: v.optional(v.string()),
    credits: v.optional(v.number()),
    priceKES: v.optional(v.number()),
    description: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);

    const { packageId, ...updates } = args;
    await ctx.db.patch(packageId, updates);

    return { success: true };
  },
});

export const deleteCreditPackage = mutation({
  args: { packageId: v.id("creditPackages") },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    await ctx.db.delete(args.packageId);
    return { success: true };
  },
});

// User Management
export const listAllUsers = query({
  args: { accountType: v.optional(v.union(v.literal("hospital"), v.literal("supplier"), v.literal("hospital_staff"), v.literal("admin"))) },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);

    const users = await ctx.db.query("users").collect();

    const filtered = args.accountType
      ? users.filter((u) => u.accountType === args.accountType)
      : users;

    return filtered;
  },
});

export const toggleUserActive = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    await ctx.db.patch(args.userId, {
      isActive: !user.isActive,
    });

    return { success: true };
  },
});

// RFQ Monitoring
export const listAllRfqs = query({
  args: { status: v.optional(v.union(v.literal("open"), v.literal("closed"), v.literal("fulfilled"))) },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);

    const rfqs = args.status
      ? await ctx.db
          .query("rfqs")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect()
      : await ctx.db.query("rfqs").order("desc").collect();

    const rfqsWithDetails = await Promise.all(
      rfqs.map(async (rfq) => {
        const hospital = await ctx.db.get(rfq.hospitalId);
        const category = await ctx.db.get(rfq.categoryId);
        const creator = await ctx.db.get(rfq.createdBy);

        // Count quotations
        const quotations = await ctx.db
          .query("quotations")
          .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
          .collect();

        return {
          ...rfq,
          hospitalName: hospital?.name || "Unknown",
          categoryName: category?.name || "Unknown",
          creatorName: creator?.name || "Unknown",
          quotationCount: quotations.length,
        };
      })
    );

    return rfqsWithDetails;
  },
});
