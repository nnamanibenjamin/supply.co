import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Search products (public - for homepage search)
export const searchProducts = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    if (args.query.trim() === "") {
      // Return recent products if no query
      return await ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("desc")
        .take(limit);
    }

    // Search by name
    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_name", (q) =>
        q.search("name", args.query).eq("isActive", true)
      )
      .take(limit);

    return results;
  },
});

// Browse products (public - for products page)
export const browseProducts = query({
  args: {
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    let products;

    if (args.categoryId !== undefined) {
      products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) =>
          q.eq("categoryId", args.categoryId!).eq("isActive", true)
        )
        .order("desc")
        .take(100);
    } else {
      products = await ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .order("desc")
        .take(100);
    }

    // Get category names
    const productsWithCategories = await Promise.all(
      products.map(async (product) => {
        const category = await ctx.db.get(product.categoryId);
        return {
          ...product,
          categoryName: category?.name || "Unknown",
        };
      })
    );

    return productsWithCategories;
  },
});

// Get product by ID
export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new ConvexError({
        message: "Product not found",
        code: "NOT_FOUND",
      });
    }

    // Get category and supplier details
    const category = await ctx.db.get(product.categoryId);
    const supplier = await ctx.db.get(product.supplierId);

    return {
      ...product,
      category,
      supplier,
    };
  },
});

// Get products by supplier (for supplier dashboard)
export const getSupplierProducts = query({
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
        message: "Only suppliers can view products",
        code: "FORBIDDEN",
      });
    }

    const supplierId = user.supplierId;

    const products = await ctx.db
      .query("products")
      .withIndex("by_supplier", (q) => q.eq("supplierId", supplierId).eq("isActive", true))
      .collect();

    // Get category names for each product
    const productsWithCategories = await Promise.all(
      products.map(async (product) => {
        const category = await ctx.db.get(product.categoryId);
        return {
          ...product,
          categoryName: category?.name || "Unknown",
        };
      })
    );

    return productsWithCategories;
  },
});

// Add product (supplier only)
export const addProduct = mutation({
  args: {
    name: v.string(),
    categoryId: v.id("categories"),
    brand: v.optional(v.string()),
    modelSku: v.optional(v.string()),
    unit: v.string(),
    defaultUnitPrice: v.number(),
    moq: v.number(),
    deliveryTime: v.string(),
    countryOfOrigin: v.optional(v.string()),
    warranty: v.optional(v.string()),
    imageStorageIds: v.array(v.id("_storage")),
    description: v.optional(v.string()),
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

    if (!user || !user.supplierId) {
      throw new ConvexError({
        message: "Only suppliers can add products",
        code: "FORBIDDEN",
      });
    }

    // Check if supplier is verified
    const supplier = await ctx.db.get(user.supplierId);
    if (!supplier || supplier.verificationStatus !== "approved") {
      throw new ConvexError({
        message: "Your supplier account must be approved before adding products",
        code: "FORBIDDEN",
      });
    }

    const productId = await ctx.db.insert("products", {
      name: args.name,
      categoryId: args.categoryId,
      supplierId: user.supplierId,
      brand: args.brand,
      modelSku: args.modelSku,
      unit: args.unit,
      defaultUnitPrice: args.defaultUnitPrice,
      moq: args.moq,
      deliveryTime: args.deliveryTime,
      countryOfOrigin: args.countryOfOrigin,
      warranty: args.warranty,
      imageStorageIds: args.imageStorageIds,
      description: args.description,
      isActive: true,
    });

    return productId;
  },
});

// Update product (supplier only)
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    brand: v.optional(v.string()),
    modelSku: v.optional(v.string()),
    unit: v.optional(v.string()),
    defaultUnitPrice: v.optional(v.number()),
    moq: v.optional(v.number()),
    deliveryTime: v.optional(v.string()),
    countryOfOrigin: v.optional(v.string()),
    warranty: v.optional(v.string()),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
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

    if (!user || !user.supplierId) {
      throw new ConvexError({
        message: "Only suppliers can update products",
        code: "FORBIDDEN",
      });
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError({
        message: "Product not found",
        code: "NOT_FOUND",
      });
    }

    // Check if supplier owns this product
    if (product.supplierId !== user.supplierId) {
      throw new ConvexError({
        message: "You can only update your own products",
        code: "FORBIDDEN",
      });
    }

    const { productId, ...updates } = args;
    await ctx.db.patch(productId, updates);

    return { success: true };
  },
});

// Delete product (supplier only)
export const deleteProduct = mutation({
  args: { productId: v.id("products") },
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

    if (!user || !user.supplierId) {
      throw new ConvexError({
        message: "Only suppliers can delete products",
        code: "FORBIDDEN",
      });
    }

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new ConvexError({
        message: "Product not found",
        code: "NOT_FOUND",
      });
    }

    // Check if supplier owns this product
    if (product.supplierId !== user.supplierId) {
      throw new ConvexError({
        message: "You can only delete your own products",
        code: "FORBIDDEN",
      });
    }

    // Soft delete by setting isActive to false
    await ctx.db.patch(args.productId, { isActive: false });

    return { success: true };
  },
});
