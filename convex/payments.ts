"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { action } from "./_generated/server";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel.d.ts";

// Create a Stripe Checkout session for credit purchase
export const createCheckoutSession = action({
  args: {
    packageId: v.id("creditPackages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Must be logged in to purchase credits",
      });
    }

    // Initialize Stripe inside the handler
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-11-17.clover",
    });

    // Get current user
    const user = await ctx.runQuery(api.registration.getCurrentUser);
    if (!user || user.accountType !== "supplier") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only suppliers can purchase credits",
      });
    }

    if (user.verificationStatus !== "approved") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Your account must be verified before purchasing credits",
      });
    }

    // Get package details
    const creditPackage = await ctx.runQuery(api.credits.getPackages);
    const pkg = creditPackage.find((p: { _id: Id<"creditPackages"> }) => p._id === args.packageId);

    if (!pkg || !pkg.isActive) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Credit package not found or inactive",
      });
    }

    // Create Stripe Checkout session
    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "kes",
            product_data: {
              name: pkg.name,
              description: `${pkg.credits} credits for supply.co.ke`,
            },
            unit_amount: pkg.priceKES * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        packageId: args.packageId,
        supplierId: user.supplierId || "",
        userId: user._id,
        credits: pkg.credits.toString(),
      },
      success_url: `${process.env.SITE_URL || "https://supply.co.ke"}/dashboard/credits?success=true`,
      cancel_url: `${process.env.SITE_URL || "https://supply.co.ke"}/dashboard/credits?canceled=true`,
    });

    return { url: session.url };
  },
});
