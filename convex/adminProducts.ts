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

// List all products
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await ensureAdmin(ctx);
    
    const products = await ctx.db.query("products").collect();
    
    // Fetch category and supplier count for each product
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const category = await ctx.db.get(product.categoryId);
        const supplierProducts = await ctx.db
          .query("supplierProducts")
          .withIndex("by_product", (q) => q.eq("productId", product._id))
          .collect();
        
        let imageUrl = null;
        if (product.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(product.imageStorageId);
        }
        
        return {
          ...product,
          categoryName: category?.name || "Unknown",
          supplierCount: supplierProducts.length,
          imageUrl,
        };
      })
    );
    
    return productsWithDetails;
  },
});

// Create product
export const create = mutation({
  args: {
    name: v.string(),
    categoryId: v.id("categories"),
    brand: v.optional(v.string()),
    modelSku: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    
    // Check if product with same name and category exists
    const existing = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
    
    const duplicate = existing.find(
      (p) => p.name.toLowerCase() === args.name.toLowerCase()
    );
    
    if (duplicate) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "A product with this name already exists in this category",
      });
    }
    
    const productId = await ctx.db.insert("products", {
      name: args.name,
      categoryId: args.categoryId,
      brand: args.brand,
      modelSku: args.modelSku,
      imageStorageId: args.imageStorageId,
      description: args.description,
      isActive: true,
    });
    
    return productId;
  },
});

// Update product
export const update = mutation({
  args: {
    productId: v.id("products"),
    name: v.string(),
    categoryId: v.id("categories"),
    brand: v.optional(v.string()),
    modelSku: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Product not found",
      });
    }
    
    // Check for duplicate name (excluding current product)
    const existing = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
    
    const duplicate = existing.find(
      (p) =>
        p._id !== args.productId &&
        p.name.toLowerCase() === args.name.toLowerCase()
    );
    
    if (duplicate) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "A product with this name already exists in this category",
      });
    }
    
    await ctx.db.patch(args.productId, {
      name: args.name,
      categoryId: args.categoryId,
      brand: args.brand,
      modelSku: args.modelSku,
      imageStorageId: args.imageStorageId,
      description: args.description,
      isActive: args.isActive,
    });
    
    return args.productId;
  },
});

// Delete product
export const remove = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Product not found",
      });
    }
    
    // Check if product has suppliers
    const supplierProducts = await ctx.db
      .query("supplierProducts")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .first();
    
    if (supplierProducts) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Cannot delete product with suppliers. Deactivate it instead.",
      });
    }
    
    await ctx.db.delete(args.productId);
  },
});

// List product requests
export const listRequests = query({
  args: { status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))) },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    
    const requests = args.status
      ? await ctx.db
          .query("productRequests")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("productRequests").collect();
    
    // Fetch supplier and category details
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const supplier = await ctx.db.get(request.supplierId);
        const category = await ctx.db.get(request.categoryId);
        let productName = null;
        if (request.createdProductId) {
          const product = await ctx.db.get(request.createdProductId);
          productName = product?.name;
        }
        return {
          ...request,
          supplierName: supplier?.companyName || "Unknown",
          categoryName: category?.name || "Unknown",
          createdProductName: productName,
        };
      })
    );
    
    return requestsWithDetails;
  },
});

// Approve product request
export const approveRequest = mutation({
  args: {
    requestId: v.id("productRequests"),
    productId: v.id("products"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Request not found",
      });
    }
    
    await ctx.db.patch(args.requestId, {
      status: "approved",
      adminNotes: args.adminNotes,
      createdProductId: args.productId,
    });
    
    // Add the product to the supplier's products
    await ctx.db.insert("supplierProducts", {
      supplierId: request.supplierId,
      productId: args.productId,
    });
  },
});

// Reject product request
export const rejectRequest = mutation({
  args: {
    requestId: v.id("productRequests"),
    adminNotes: v.string(),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Request not found",
      });
    }
    
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      adminNotes: args.adminNotes,
    });
  },
});
