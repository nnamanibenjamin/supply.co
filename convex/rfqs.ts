import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";

// Create RFQ (hospital only)
export const createRFQ = mutation({
  args: {
    productName: v.string(),
    categoryId: v.id("categories"),
    productId: v.optional(v.id("products")),
    quantity: v.number(),
    unit: v.string(),
    deliveryLocation: v.string(),
    urgency: v.union(
      v.literal("standard"),
      v.literal("urgent"),
      v.literal("emergency")
    ),
    specifications: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || !user.hospitalId) {
      throw new ConvexError({
        message: "Only hospital users can create RFQs",
        code: "FORBIDDEN",
      });
    }

    // Check if hospital is approved
    const hospital = await ctx.db.get(user.hospitalId);
    if (!hospital || hospital.verificationStatus !== "approved") {
      throw new ConvexError({
        message: "Your hospital account must be approved before creating RFQs",
        code: "FORBIDDEN",
      });
    }

    // Create the RFQ
    const rfqId = await ctx.db.insert("rfqs", {
      hospitalId: user.hospitalId,
      productName: args.productName,
      categoryId: args.categoryId,
      productId: args.productId,
      quantity: args.quantity,
      unit: args.unit,
      deliveryLocation: args.deliveryLocation,
      urgency: args.urgency,
      specifications: args.specifications,
      status: "open",
      createdBy: user._id,
    });

    // Auto-generate quotations from matching products
    await ctx.scheduler.runAfter(0, internal.rfqs.generateAutoQuotations, {
      rfqId,
    });

    return rfqId;
  },
});

// Get hospital's RFQs
export const getHospitalRFQs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || !user.hospitalId) {
      throw new ConvexError({
        message: "Only hospital users can view RFQs",
        code: "FORBIDDEN",
      });
    }

    const rfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_hospital", (q) => q.eq("hospitalId", user.hospitalId!))
      .order("desc")
      .collect();

    // Get category names and quotation counts
    const rfqsWithDetails = await Promise.all(
      rfqs.map(async (rfq) => {
        const category = await ctx.db.get(rfq.categoryId);
        const quotations = await ctx.db
          .query("quotations")
          .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
          .collect();

        return {
          ...rfq,
          categoryName: category?.name || "Unknown",
          quotationCount: quotations.length,
        };
      })
    );

    return rfqsWithDetails;
  },
});

// Get single RFQ with details
export const getRFQ = query({
  args: { rfqId: v.id("rfqs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq) {
      throw new ConvexError({
        message: "RFQ not found",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // Check access permissions
    const isHospitalUser = user.hospitalId === rfq.hospitalId;
    const isSupplier = user.supplierId !== undefined;

    if (!isHospitalUser && !isSupplier) {
      throw new ConvexError({
        message: "You don't have permission to view this RFQ",
        code: "FORBIDDEN",
      });
    }

    const category = await ctx.db.get(rfq.categoryId);
    const hospital = await ctx.db.get(rfq.hospitalId);
    const product = rfq.productId ? await ctx.db.get(rfq.productId) : null;

    return {
      ...rfq,
      category,
      hospital,
      product,
    };
  },
});

// Get available RFQs for supplier
export const getAvailableRFQs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || !user.supplierId) {
      throw new ConvexError({
        message: "Only suppliers can view available RFQs",
        code: "FORBIDDEN",
      });
    }

    const supplier = await ctx.db.get(user.supplierId);
    if (!supplier || supplier.verificationStatus !== "approved") {
      throw new ConvexError({
        message: "Your supplier account must be approved to view RFQs",
        code: "FORBIDDEN",
      });
    }

    // Get all open RFQs in supplier's categories
    const allRFQs = await ctx.db
      .query("rfqs")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .collect();

    // Filter by supplier's categories
    const relevantRFQs = allRFQs.filter((rfq) =>
      supplier.categories.includes(rfq.categoryId)
    );

    // Add category names and check if supplier already quoted
    const rfqsWithDetails = await Promise.all(
      relevantRFQs.map(async (rfq) => {
        const category = await ctx.db.get(rfq.categoryId);
        const hospital = await ctx.db.get(rfq.hospitalId);
        
        // Check if supplier has already quoted
        const existingQuotation = await ctx.db
          .query("quotations")
          .withIndex("by_rfq_and_supplier", (q) =>
            q.eq("rfqId", rfq._id).eq("supplierId", user.supplierId!)
          )
          .first();

        const allQuotations = await ctx.db
          .query("quotations")
          .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
          .collect();

        return {
          ...rfq,
          categoryName: category?.name || "Unknown",
          hospitalName: hospital?.name || "Unknown",
          hasQuoted: !!existingQuotation,
          quotationCount: allQuotations.length,
        };
      })
    );

    return rfqsWithDetails;
  },
});

// Update RFQ status (hospital only)
export const updateRFQStatus = mutation({
  args: {
    rfqId: v.id("rfqs"),
    status: v.union(
      v.literal("open"),
      v.literal("closed"),
      v.literal("fulfilled")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || !user.hospitalId) {
      throw new ConvexError({
        message: "Only hospital users can update RFQs",
        code: "FORBIDDEN",
      });
    }

    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq) {
      throw new ConvexError({
        message: "RFQ not found",
        code: "NOT_FOUND",
      });
    }

    // Check if user's hospital owns this RFQ
    if (rfq.hospitalId !== user.hospitalId) {
      throw new ConvexError({
        message: "You can only update your hospital's RFQs",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.rfqId, { status: args.status });

    return { success: true };
  },
});

// Generate auto-quotations (internal)
export const generateAutoQuotations = internalMutation({
  args: { rfqId: v.id("rfqs") },
  handler: async (ctx, args) => {
    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq) return;

    // Find matching products by category
    const matchingProducts = await ctx.db
      .query("products")
      .withIndex("by_category", (q) =>
        q.eq("categoryId", rfq.categoryId).eq("isActive", true)
      )
      .collect();

    // Create auto-quotations for matching products
    for (const product of matchingProducts) {
      // Check if supplier is approved
      const supplier = await ctx.db.get(product.supplierId);
      if (!supplier || supplier.verificationStatus !== "approved") {
        continue;
      }

      // Check if quotation already exists
      const existingQuotation = await ctx.db
        .query("quotations")
        .withIndex("by_rfq_and_supplier", (q) =>
          q.eq("rfqId", rfq._id).eq("supplierId", product.supplierId)
        )
        .first();

      if (existingQuotation) {
        continue;
      }

      // Calculate total price
      const totalPrice = product.defaultUnitPrice * rfq.quantity;

      // Create auto-quotation
      await ctx.db.insert("quotations", {
        rfqId: rfq._id,
        supplierId: product.supplierId,
        productId: product._id,
        unitPrice: product.defaultUnitPrice,
        totalPrice,
        deliveryTime: product.deliveryTime,
        isAutoGenerated: true,
        status: "pending",
      });
    }
  },
});
