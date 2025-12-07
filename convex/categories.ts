import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

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

export const getActiveCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return categories;
  },
});

// Admin: List all categories
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await ensureAdmin(ctx);
    
    const categories = await ctx.db.query("categories").collect();
    
    // Count suppliers for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const suppliers = await ctx.db
          .query("suppliers")
          .collect();
        const supplierCount = suppliers.filter((s) =>
          s.categories.includes(category._id)
        ).length;
        
        const products = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .collect();
        
        return {
          ...category,
          supplierCount,
          productCount: products.length,
        };
      })
    );
    
    return categoriesWithCounts;
  },
});

// Admin: Create category
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    
    // Check if category with same name exists
    const existing = await ctx.db.query("categories").collect();
    const duplicate = existing.find(
      (c) => c.name.toLowerCase() === args.name.toLowerCase()
    );
    
    if (duplicate) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "A category with this name already exists",
      });
    }
    
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      description: args.description,
      isActive: true,
    });
    
    return categoryId;
  },
});

// Admin: Update category
export const update = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Category not found",
      });
    }
    
    // Check for duplicate name (excluding current category)
    const existing = await ctx.db.query("categories").collect();
    const duplicate = existing.find(
      (c) =>
        c._id !== args.categoryId &&
        c.name.toLowerCase() === args.name.toLowerCase()
    );
    
    if (duplicate) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "A category with this name already exists",
      });
    }
    
    await ctx.db.patch(args.categoryId, {
      name: args.name,
      description: args.description,
      isActive: args.isActive,
    });
    
    return args.categoryId;
  },
});

// Admin: Delete category
export const remove = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    
    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Category not found",
      });
    }
    
    // Check if category has products
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .first();
    
    if (products) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Cannot delete category with existing products. Deactivate it instead.",
      });
    }
    
    // Check if category has suppliers
    const suppliers = await ctx.db.query("suppliers").collect();
    const hasSuppliers = suppliers.some((s) =>
      s.categories.includes(args.categoryId)
    );
    
    if (hasSuppliers) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Cannot delete category with registered suppliers. Deactivate it instead.",
      });
    }
    
    await ctx.db.delete(args.categoryId);
  },
});
