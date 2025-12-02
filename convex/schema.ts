import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    accountType: v.union(
      v.literal("hospital"),
      v.literal("supplier"),
      v.literal("hospital_staff"),
      v.literal("admin")
    ),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    isActive: v.boolean(),
    hospitalId: v.optional(v.id("hospitals")),
    supplierId: v.optional(v.id("suppliers")),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_verification_status", ["verificationStatus"])
    .index("by_hospital", ["hospitalId"])
    .index("by_supplier", ["supplierId"]),

  hospitals: defineTable({
    name: v.string(),
    contactPerson: v.string(),
    phone: v.string(),
    email: v.string(),
    hospitalCode: v.string(),
    medicalLicenseStorageId: v.optional(v.id("_storage")),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    createdBy: v.id("users"),
  })
    .index("by_hospital_code", ["hospitalCode"])
    .index("by_verification_status", ["verificationStatus"])
    .index("by_email", ["email"]),

  suppliers: defineTable({
    companyName: v.string(),
    contactPerson: v.string(),
    phone: v.string(),
    email: v.string(),
    cr12StorageId: v.optional(v.id("_storage")),
    categories: v.array(v.id("categories")),
    credits: v.number(),
    verificationStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    isActive: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_verification_status", ["verificationStatus"])
    .index("by_email", ["email"]),

  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_active", ["isActive"]),
});
