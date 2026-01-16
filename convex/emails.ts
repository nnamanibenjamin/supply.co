"use node";

import { v } from "convex/values";
import { Resend } from "resend";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel.d.ts";

// Email templates
function getEmailTemplate(
  type: string,
  data: {
    title: string;
    message: string;
    metadata?: {
      hospitalName?: string;
      supplierName?: string;
      productName?: string;
      price?: number;
    };
    rfqId?: Id<"rfqs">;
    quotationId?: Id<"quotations">;
  }
): { subject: string; html: string } {
  const baseUrl = process.env.VITE_SITE_URL || "https://supply.co.ke";

  // Build action link
  let actionLink = baseUrl;
  if (data.rfqId) {
    actionLink = `${baseUrl}/dashboard/rfqs/${data.rfqId}`;
  } else if (data.quotationId) {
    actionLink = `${baseUrl}/dashboard/quotations`;
  }

  const templates: Record<string, { subject: string; html: string }> = {
    new_rfq: {
      subject: `New RFQ Available: ${data.metadata?.productName || ""}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #52a27f 0%, #3a8c65 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #52a27f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .highlight { background: #e8f5e9; padding: 15px; border-left: 4px solid #52a27f; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New RFQ Available</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p><strong>${data.metadata?.hospitalName || "A hospital"}</strong> has posted a new Request for Quotation that matches your product categories:</p>
      
      <div class="highlight">
        <p><strong>Product:</strong> ${data.metadata?.productName || "N/A"}</p>
        <p style="margin: 5px 0;">${data.message}</p>
      </div>
      
      <p>This is your opportunity to submit a competitive quotation and win this business.</p>
      
      <a href="${actionLink}" class="button">View RFQ Details</a>
      
      <p>Submit your quotation before the deadline to be considered.</p>
    </div>
    <div class="footer">
      <p>You received this email because you're registered as a supplier on our platform.</p>
      <p>To manage your email preferences, log in to your account.</p>
    </div>
  </div>
</body>
</html>
      `,
    },
    quotation_submitted: {
      subject: `New Quotation Received for ${data.metadata?.productName || "Your RFQ"}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #52a27f 0%, #3a8c65 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #52a27f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .highlight { background: #e8f5e9; padding: 15px; border-left: 4px solid #52a27f; margin: 20px 0; }
    .price { font-size: 24px; font-weight: bold; color: #52a27f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 New Quotation Received</h1>
    </div>
    <div class="content">
      <p>Great news!</p>
      <p><strong>${data.metadata?.supplierName || "A supplier"}</strong> has submitted a quotation for your request:</p>
      
      <div class="highlight">
        <p><strong>Product:</strong> ${data.metadata?.productName || "N/A"}</p>
        ${data.metadata?.price ? `<p class="price">KES ${data.metadata.price.toLocaleString()}</p>` : ""}
      </div>
      
      <p>Review the quotation details and compare it with other submissions to make the best choice for your facility.</p>
      
      <a href="${actionLink}" class="button">View Quotation</a>
      
      <p>Don't forget to check delivery times, payment terms, and other important details.</p>
    </div>
    <div class="footer">
      <p>You received this email because you created an RFQ on our platform.</p>
      <p>To manage your email preferences, log in to your account.</p>
    </div>
  </div>
</body>
</html>
      `,
    },
    quotation_accepted: {
      subject: `🎉 Your Quotation Was Accepted!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #52a27f 0%, #3a8c65 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #52a27f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .success { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
    </div>
    <div class="content">
      <div class="success">
        <h2 style="color: #4caf50; margin: 0;">Your Quotation Was Accepted!</h2>
      </div>
      
      <p>Excellent work!</p>
      <p><strong>${data.metadata?.hospitalName || "The hospital"}</strong> has accepted your quotation for <strong>${data.metadata?.productName || "their request"}</strong>.</p>
      
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Wait for the hospital to send you the Local Purchase Order (LPO)</li>
        <li>Prepare a Proforma Invoice once you receive the LPO</li>
        <li>Ensure timely delivery as per your quoted terms</li>
      </ul>
      
      <a href="${actionLink}" class="button">View Details</a>
      
      <p>Thank you for using our platform. We wish you a smooth transaction!</p>
    </div>
    <div class="footer">
      <p>You received this email because you submitted a quotation on our platform.</p>
      <p>To manage your email preferences, log in to your account.</p>
    </div>
  </div>
</body>
</html>
      `,
    },
    quotation_rejected: {
      subject: `Update on Your Quotation for ${data.metadata?.productName || ""}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #52a27f 0%, #3a8c65 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #52a27f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .info { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Quotation Update</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We wanted to update you on your recent quotation for <strong>${data.metadata?.productName || "the RFQ"}</strong>.</p>
      
      <div class="info">
        <p>${data.message}</p>
      </div>
      
      <p><strong>Keep Going!</strong></p>
      <ul>
        <li>There are always more opportunities on our platform</li>
        <li>Review your pricing and delivery terms to stay competitive</li>
        <li>Check for new RFQs that match your products</li>
      </ul>
      
      <a href="${baseUrl}/dashboard/rfqs" class="button">Browse New RFQs</a>
      
      <p>Thank you for your participation. We look forward to your next quotation!</p>
    </div>
    <div class="footer">
      <p>You received this email because you submitted a quotation on our platform.</p>
      <p>To manage your email preferences, log in to your account.</p>
    </div>
  </div>
</body>
</html>
      `,
    },
    low_credits: {
      subject: `⚠️ Low Credit Balance - Recharge Now`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .warning { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Low Credit Balance</h1>
    </div>
    <div class="content">
      <div class="warning">
        <p><strong>Your credit balance is running low!</strong></p>
        <p>${data.message}</p>
      </div>
      
      <p>You need credits to submit quotations and respond to RFQs.</p>
      
      <p><strong>Don't miss out on opportunities!</strong></p>
      <ul>
        <li>Each quotation submission costs 1 credit</li>
        <li>Purchase credits now to keep responding to RFQs</li>
        <li>Choose from flexible credit packages</li>
      </ul>
      
      <a href="${baseUrl}/dashboard/credits/purchase" class="button">Purchase Credits</a>
      
      <p>Keep your business growing by staying active on the platform!</p>
    </div>
    <div class="footer">
      <p>You received this email because you're registered as a supplier on our platform.</p>
      <p>To manage your email preferences, log in to your account.</p>
    </div>
  </div>
</body>
</html>
      `,
    },
    account_verified: {
      subject: `✅ Your Account Has Been Verified!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .success { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Welcome Aboard!</h1>
    </div>
    <div class="content">
      <div class="success">
        <h2 style="color: #4caf50; margin: 0;">Your Account Is Now Active!</h2>
      </div>
      
      <p>Great news! Your account has been verified and approved.</p>
      <p>${data.message}</p>
      
      <p><strong>What You Can Do Now:</strong></p>
      <ul>
        <li>Browse available RFQs from hospitals</li>
        <li>Submit competitive quotations</li>
        <li>Manage your product catalog</li>
        <li>Track your quotations and orders</li>
      </ul>
      
      <a href="${baseUrl}/dashboard" class="button">Go to Dashboard</a>
      
      <p>Thank you for joining our platform. We're excited to help you grow your business!</p>
    </div>
    <div class="footer">
      <p>Welcome to our procurement platform.</p>
      <p>For support, contact us at hello@example.com</p>
    </div>
  </div>
</body>
</html>
      `,
    },
    account_rejected: {
      subject: `Update on Your Account Application`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #e53935 0%, #c62828 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #e53935; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .info { background: #ffebee; padding: 15px; border-left: 4px solid #e53935; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Account Application Update</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for applying to join our platform.</p>
      
      <div class="info">
        <p>${data.message}</p>
      </div>
      
      <p>If you believe this was an error or have questions, please contact our support team at hello@example.com</p>
      
      <p>You can reapply with updated information if you address the verification issues.</p>
    </div>
    <div class="footer">
      <p>For support, contact us at hello@example.com</p>
    </div>
  </div>
</body>
</html>
      `,
    },
  };

  return (
    templates[type] || {
      subject: data.title,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #52a27f 0%, #3a8c65 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #52a27f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.title}</h1>
    </div>
    <div class="content">
      <p>${data.message}</p>
      <a href="${actionLink}" class="button">View Details</a>
    </div>
    <div class="footer">
      <p>You received this notification from our platform.</p>
    </div>
  </div>
</body>
</html>
      `,
    }
  );
}

// Internal action to send notification email
export const sendNotificationEmail = internalAction({
  args: {
    userEmail: v.string(),
    notificationType: v.union(
      v.literal("new_rfq"),
      v.literal("quotation_submitted"),
      v.literal("quotation_accepted"),
      v.literal("quotation_rejected"),
      v.literal("rfq_closed"),
      v.literal("account_verified"),
      v.literal("account_rejected"),
      v.literal("low_credits")
    ),
    title: v.string(),
    message: v.string(),
    rfqId: v.optional(v.id("rfqs")),
    quotationId: v.optional(v.id("quotations")),
    metadata: v.optional(
      v.object({
        hospitalName: v.optional(v.string()),
        supplierName: v.optional(v.string()),
        productName: v.optional(v.string()),
        price: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not configured");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const resend = new Resend(apiKey);

      const emailTemplate = getEmailTemplate(args.notificationType, {
        title: args.title,
        message: args.message,
        metadata: args.metadata,
        rfqId: args.rfqId,
        quotationId: args.quotationId,
      });

      const result = await resend.emails.send({
        from: "MediSupply Connect <onboarding@resend.dev>",
        to: [args.userEmail],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      if (result.error) {
        console.error("Resend error:", result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to send email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Test email action (for admin testing)
export const sendTestEmail = action({
  args: { to: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to send test email");
    }

    return await ctx.runAction(internal.emails.sendNotificationEmail, {
      userEmail: args.to,
      notificationType: "new_rfq",
      title: "Test Email",
      message: "This is a test email from the notification system.",
      metadata: {
        hospitalName: "Test Hospital",
        productName: "Test Product",
      },
    });
  },
});
