import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Generate upload URL for documents
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get current user with hospital and supplier details
export const getCurrentUser = query({
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

    if (!user) {
      return null;
    }

    // Fetch hospital details if applicable
    let hospital = null;
    if (user.hospitalId) {
      hospital = await ctx.db.get(user.hospitalId);
    }

    // Fetch supplier details if applicable
    let supplier = null;
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

// Register hospital account (called after Hercules Auth signin)
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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (existingUser) {
      throw new ConvexError({
        message: "You have already completed registration",
        code: "CONFLICT",
      });
    }

    // Check if email already exists
    const existingEmail = await ctx.db
      .query("hospitals")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingEmail) {
      throw new ConvexError({
        message: "A hospital with this email already exists",
        code: "CONFLICT",
      });
    }

    // Check if phone already exists
    const allHospitals = await ctx.db.query("hospitals").collect();
    const existingPhone = allHospitals.find((h) => h.phone === args.phone);

    if (existingPhone) {
      throw new ConvexError({
        message: "A hospital with this phone number already exists",
        code: "CONFLICT",
      });
    }

    // Check if hospital name already exists
    const existingName = allHospitals.find(
      (h) => h.name.toLowerCase() === args.hospitalName.toLowerCase()
    );

    if (existingName) {
      throw new ConvexError({
        message: "A hospital with this name already exists",
        code: "CONFLICT",
      });
    }

    // Generate unique hospital code
    let hospitalCode = "";
    let codeExists = true;
    while (codeExists) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      hospitalCode = `HOSP-${randomNum}`;
      const existingCode = await ctx.db
        .query("hospitals")
        .withIndex("by_hospital_code", (q) => q.eq("hospitalCode", hospitalCode))
        .first();
      codeExists = !!existingCode;
    }

    // Create user account
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

    // Link user to hospital
    await ctx.db.patch(userId, { hospitalId });

    return { hospitalCode, userId, hospitalId };
  },
});

// Register supplier account (called after Hercules Auth signin)
export const registerSupplier = mutation({
  args: {
    companyName: v.string(),
    contactPerson: v.string(),
    phone: v.string(),
    email: v.string(),
    cr12StorageId: v.optional(v.id("_storage")),
    categories: v.array(v.id("categories")),
    products: v.array(v.id("products")),
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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (existingUser) {
      throw new ConvexError({
        message: "You have already completed registration",
        code: "CONFLICT",
      });
    }

    // Check if email already exists
    const existingEmail = await ctx.db
      .query("suppliers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingEmail) {
      throw new ConvexError({
        message: "A supplier with this email already exists",
        code: "CONFLICT",
      });
    }

    // Check if phone already exists
    const allSuppliers = await ctx.db.query("suppliers").collect();
    const existingPhone = allSuppliers.find((s) => s.phone === args.phone);

    if (existingPhone) {
      throw new ConvexError({
        message: "A supplier with this phone number already exists",
        code: "CONFLICT",
      });
    }

    // Check if company name already exists
    const existingCompany = allSuppliers.find(
      (s) => s.companyName.toLowerCase() === args.companyName.toLowerCase()
    );

    if (existingCompany) {
      throw new ConvexError({
        message: "A supplier with this company name already exists",
        code: "CONFLICT",
      });
    }

    // Create user account
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

    // Link user to supplier
    await ctx.db.patch(userId, { supplierId });

    // Add selected products to supplier's product list
    await Promise.all(
      args.products.map(async (productId) => {
        await ctx.db.insert("supplierProducts", {
          supplierId,
          productId,
        });
      })
    );

    return { userId, supplierId };
  },
});

// Register hospital staff account (called after Hercules Auth signin)
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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (existingUser) {
      throw new ConvexError({
        message: "You have already completed registration",
        code: "CONFLICT",
      });
    }

    // Find hospital by code
    const hospital = await ctx.db
      .query("hospitals")
      .withIndex("by_hospital_code", (q) => q.eq("hospitalCode", args.hospitalCode))
      .first();

    if (!hospital) {
      throw new ConvexError({
        message: "Invalid hospital code. Please check and try again.",
        code: "NOT_FOUND",
      });
    }

    if (hospital.verificationStatus !== "approved") {
      throw new ConvexError({
        message: "This hospital is not yet verified. Please contact the hospital administrator.",
        code: "FORBIDDEN",
      });
    }

    // Create user account
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

    return { userId, hospitalId: hospital._id };
  },
});


