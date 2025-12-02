import { query } from "./_generated/server";

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
