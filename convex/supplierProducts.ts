import { ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get products by category (for selection during registration/dashboard)
export const getByCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => 
        q.eq("categoryId", args.categoryId).eq("isActive", true)
      )
      .collect();
    
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        let imageUrl = null;
        if (product.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(product.imageStorageId);
        }
        return {
          ...product,
          imageUrl,
        };
      })
    );
    
    return productsWithImages;
  },
});

// Get supplier's selected products
export const getSupplierProducts = query({
  args: {},
  handler: async (ctx) => {
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
    
    if (!user || !user.supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Supplier account required",
      });
    }
    
    const supplierProducts = await ctx.db
      .query("supplierProducts")
      .withIndex("by_supplier", (q) => q.eq("supplierId", user.supplierId!))
      .collect();
    
    const products = await Promise.all(
      supplierProducts.map(async (sp) => {
        const product = await ctx.db.get(sp.productId);
        if (!product) return null;
        
        const category = await ctx.db.get(product.categoryId);
        let imageUrl = null;
        if (product.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(product.imageStorageId);
        }
        
        return {
          ...product,
          categoryName: category?.name || "Unknown",
          imageUrl,
          supplierProductId: sp._id,
        };
      })
    );
    
    return products.filter((p) => p !== null);
  },
});

// Add product to supplier's selection
export const addProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
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
    
    if (!user || !user.supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Supplier account required",
      });
    }
    
    // Check if already added
    const existing = await ctx.db
      .query("supplierProducts")
      .withIndex("by_supplier_and_product", (q) => 
        q.eq("supplierId", user.supplierId!).eq("productId", args.productId)
      )
      .first();
    
    if (existing) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Product already added to your selection",
      });
    }
    
    const id = await ctx.db.insert("supplierProducts", {
      supplierId: user.supplierId!,
      productId: args.productId,
    });
    
    return id;
  },
});

// Remove product from supplier's selection
export const removeProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
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
    
    if (!user || !user.supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Supplier account required",
      });
    }
    
    const supplierProduct = await ctx.db
      .query("supplierProducts")
      .withIndex("by_supplier_and_product", (q) => 
        q.eq("supplierId", user.supplierId!).eq("productId", args.productId)
      )
      .first();
    
    if (!supplierProduct) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Product not in your selection",
      });
    }
    
    await ctx.db.delete(supplierProduct._id);
  },
});

// Request new product
export const requestProduct = mutation({
  args: {
    productName: v.string(),
    categoryId: v.id("categories"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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
    
    if (!user || !user.supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Supplier account required",
      });
    }
    
    const requestId = await ctx.db.insert("productRequests", {
      supplierId: user.supplierId!,
      productName: args.productName,
      categoryId: args.categoryId,
      description: args.description,
      status: "pending",
    });
    
    return requestId;
  },
});

// Get supplier's product requests
export const getRequests = query({
  args: {},
  handler: async (ctx) => {
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
    
    if (!user || !user.supplierId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Supplier account required",
      });
    }
    
    const requests = await ctx.db
      .query("productRequests")
      .withIndex("by_supplier", (q) => q.eq("supplierId", user.supplierId!))
      .collect();
    
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        const category = await ctx.db.get(request.categoryId);
        let productName = null;
        if (request.createdProductId) {
          const product = await ctx.db.get(request.createdProductId);
          productName = product?.name;
        }
        return {
          ...request,
          categoryName: category?.name || "Unknown",
          createdProductName: productName,
        };
      })
    );
    
    return requestsWithDetails;
  },
});

// Public: Get single product details
export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Product not found",
      });
    }
    
    const category = await ctx.db.get(product.categoryId);
    let imageUrl = null;
    if (product.imageStorageId) {
      imageUrl = await ctx.storage.getUrl(product.imageStorageId);
    }
    
    return {
      ...product,
      categoryName: category?.name || "Unknown",
      imageUrl,
    };
  },
});

// Public: Browse products
export const browse = query({
  args: { 
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    let products;
    if (args.categoryId) {
      products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => 
          q.eq("categoryId", args.categoryId!).eq("isActive", true)
        )
        .collect();
    } else {
      products = await ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }
    
    const productsWithDetails = await Promise.all(
      products.map(async (product) => {
        const category = await ctx.db.get(product.categoryId);
        let imageUrl = null;
        if (product.imageStorageId) {
          imageUrl = await ctx.storage.getUrl(product.imageStorageId);
        }
        
        // Count suppliers
        const supplierProducts = await ctx.db
          .query("supplierProducts")
          .withIndex("by_product", (q) => q.eq("productId", product._id))
          .collect();
        
        return {
          ...product,
          categoryName: category?.name || "Unknown",
          imageUrl,
          supplierCount: supplierProducts.length,
        };
      })
    );
    
    return productsWithDetails;
  },
});
