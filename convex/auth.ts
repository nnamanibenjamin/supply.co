import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Generate a unique hospital code
function generateHospitalCode(): string {
  const prefix = "H";
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${randomNum}`;
}

// Get current user profile
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return null;
    }

    // Get hospital or supplier details if applicable
    let hospital = null;
    let supplier = null;

    if (user.hospitalId) {
      hospital = await ctx.db.get(user.hospitalId);
    }

    if (user.supplierId) {
      supplier = await ctx.db.get(user.supplierId);
    }

    return {
      ...user,
      hospital,
      supplier,
    };
  },
});

// Check if user profile exists
export const checkUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { exists: false };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    return { exists: !!user, user: user || null };
  },
});

// Generate upload URL for documents
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Register hospital
export const registerHospital = mutation({
  args: {
    hospitalName: v.string(),
    contactPerson: v.string(),
    phone: v.string(),
    email: v.string(),
    medicalLicenseStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    // Check if user already has a profile
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existingUser) {
      throw new ConvexError({
        message: "User profile already exists",
        code: "CONFLICT",
      });
    }

    // Check if email is already used
    const existingEmail = await ctx.db
      .query("hospitals")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingEmail) {
      throw new ConvexError({
        message: "Email already registered",
        code: "CONFLICT",
      });
    }

    // Generate unique hospital code
    let hospitalCode = generateHospitalCode();
    let codeExists = await ctx.db
      .query("hospitals")
      .withIndex("by_hospital_code", (q) => q.eq("hospitalCode", hospitalCode))
      .first();

    while (codeExists) {
      hospitalCode = generateHospitalCode();
      codeExists = await ctx.db
        .query("hospitals")
        .withIndex("by_hospital_code", (q) =>
          q.eq("hospitalCode", hospitalCode)
        )
        .first();
    }

    // Create user first
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: args.contactPerson,
      email: args.email,
      phone: args.phone,
      accountType: "hospital",
      verificationStatus: "pending",
      isActive: false,
    });

    // Create hospital
    const hospitalId = await ctx.db.insert("hospitals", {
      name: args.hospitalName,
      contactPerson: args.contactPerson,
      phone: args.phone,
      email: args.email,
      hospitalCode,
      medicalLicenseStorageId: args.medicalLicenseStorageId,
      verificationStatus: "pending",
      createdBy: userId,
    });

    // Update user with hospitalId
    await ctx.db.patch(userId, {
      hospitalId,
    });

    return { success: true, hospitalCode };
  },
});

// Register supplier
export const registerSupplier = mutation({
  args: {
    companyName: v.string(),
    contactPerson: v.string(),
    phone: v.string(),
    email: v.string(),
    cr12StorageId: v.optional(v.id("_storage")),
    categories: v.array(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    // Check if user already has a profile
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existingUser) {
      throw new ConvexError({
        message: "User profile already exists",
        code: "CONFLICT",
      });
    }

    // Check if email is already used
    const existingEmail = await ctx.db
      .query("suppliers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingEmail) {
      throw new ConvexError({
        message: "Email already registered",
        code: "CONFLICT",
      });
    }

    // Create user first
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: args.contactPerson,
      email: args.email,
      phone: args.phone,
      accountType: "supplier",
      verificationStatus: "pending",
      isActive: false,
    });

    // Create supplier with 5 free credits
    const supplierId = await ctx.db.insert("suppliers", {
      companyName: args.companyName,
      contactPerson: args.contactPerson,
      phone: args.phone,
      email: args.email,
      cr12StorageId: args.cr12StorageId,
      categories: args.categories,
      credits: 5,
      verificationStatus: "pending",
      isActive: false,
      createdBy: userId,
    });

    // Update user with supplierId
    await ctx.db.patch(userId, {
      supplierId,
    });

    return { success: true };
  },
});

// Register hospital staff (join hospital)
export const registerHospitalStaff = mutation({
  args: {
    hospitalCode: v.string(),
    name: v.string(),
    phone: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    // Check if user already has a profile
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existingUser) {
      throw new ConvexError({
        message: "User profile already exists",
        code: "CONFLICT",
      });
    }

    // Check if hospital code exists
    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_hospital_code", (q) =>
        q.eq("hospitalCode", args.hospitalCode)
      )
      .unique();

    if (!hospital) {
      throw new ConvexError({
        message: "Invalid hospital code",
        code: "NOT_FOUND",
      });
    }

    // Check if hospital is verified
    if (hospital.verificationStatus !== "approved") {
      throw new ConvexError({
        message: "Hospital is not yet verified. Please wait for approval.",
        code: "FORBIDDEN",
      });
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: args.name,
      email: args.email,
      phone: args.phone,
      accountType: "hospital_staff",
      verificationStatus: "pending",
      isActive: false,
      hospitalId: hospital._id,
    });

    return { success: true };
  },
});
