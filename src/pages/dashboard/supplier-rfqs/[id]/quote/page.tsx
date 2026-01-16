import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const formSchema = z.object({
  supplierProductId: z.string().optional(),
  unitPrice: z.number().min(0, "Price must be positive"),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  notes: z.string().optional(),
  paymentTerms: z.enum(["cash", "installment", "both"]),
  isNegotiable: z.boolean(),
  installmentAvailable: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export default function SubmitQuotePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold">supply.co.ke</span>
          </Link>
          <Link to="/dashboard/supplier-rfqs">
            <Button variant="ghost">Back to RFQs</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Unauthenticated>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to submit a quotation</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SignInButton>
                <Button>Sign In</Button>
              </SignInButton>
            </CardContent>
          </Card>
        </Unauthenticated>

        <AuthLoading>
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-[600px] w-full" />
          </div>
        </AuthLoading>

        <Authenticated>
          <SubmitQuoteForm />
        </Authenticated>
      </div>
    </div>
  );
}

function SubmitQuoteForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const rfq = useQuery(api.rfqs.getRFQ, id ? { rfqId: id as Id<"rfqs"> } : "skip");
  const currentUser = useQuery(api.registration.getCurrentUser);
  const supplierProducts = useQuery(api.supplierProducts.getMyListings);
  const submitQuotation = useMutation(api.quotations.submitQuotation);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierProductId: "",
      unitPrice: 0,
      deliveryTime: "",
      notes: "",
      paymentTerms: "both",
      isNegotiable: false,
      installmentAvailable: false,
    },
  });

  const selectedProductId = form.watch("supplierProductId");
  const selectedProduct = supplierProducts?.find((p) => p.supplierProductId === selectedProductId);

  // Auto-fill unit price when product is selected
  useState(() => {
    if (selectedProduct) {
      form.setValue("unitPrice", selectedProduct.unitPrice);
      form.setValue("deliveryTime", selectedProduct.deliveryTime);
    }
  });

  const onSubmit = async (data: FormData) => {
    if (!id) return;

    try {
      await submitQuotation({
        rfqId: id as Id<"rfqs">,
        supplierProductId: data.supplierProductId && data.supplierProductId !== "custom" 
          ? (data.supplierProductId as Id<"supplierProducts">) 
          : undefined,
        unitPrice: data.unitPrice,
        deliveryTime: data.deliveryTime,
        notes: data.notes || undefined,
        paymentTerms: data.paymentTerms,
        isNegotiable: data.isNegotiable,
        installmentAvailable: data.installmentAvailable,
      });

      toast.success("Quotation submitted successfully! The hospital will review your quote.");
      navigate("/dashboard/supplier-rfqs");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit quotation");
      }
    }
  };

  if (rfq === undefined || currentUser === undefined || supplierProducts === undefined) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>RFQ Not Found</CardTitle>
          <CardDescription>The RFQ you're looking for doesn't exist</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/dashboard/supplier-rfqs">
            <Button>Return to RFQs</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser || 
      (currentUser.accountType !== "supplier" && 
       !(currentUser.accountType === "admin" && currentUser.supplier))) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            Only suppliers can submit quotations.
            {currentUser?.accountType === "admin" && !currentUser.supplier && (
              " Please set up an admin supplier account in the admin panel first."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const totalPrice = form.watch("unitPrice") * rfq.quantity;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* RFQ Details */}
      <Card>
        <CardHeader>
          <CardTitle>RFQ Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Product</p>
              <p className="text-lg font-semibold">{rfq.productName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p className="text-lg font-semibold">{rfq.category?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quantity Needed</p>
              <p className="text-lg font-semibold">
                {rfq.quantity} {rfq.unit}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivery Location</p>
              <p className="text-lg font-semibold">{rfq.deliveryLocation}</p>
            </div>
            {rfq.expiryDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expires On</p>
                <p className="text-lg font-semibold">{new Date(rfq.expiryDate).toLocaleDateString()}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.ceil((rfq.expiryDate - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                </p>
              </div>
            )}
            {rfq.preferredPaymentTerms && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preferred Payment Terms</p>
                <p className="text-lg font-semibold">{rfq.preferredPaymentTerms}</p>
              </div>
            )}
          </div>

          {rfq.specifications && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Specifications</p>
              <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                {rfq.specifications}
              </p>
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm font-medium">Cost: 1 Credit</p>
            <p className="text-xs text-muted-foreground mt-1">
              Submitting this quotation will deduct 1 credit from your account.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quote Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Your Quotation</CardTitle>
          <CardDescription>Provide your pricing and delivery details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="supplierProductId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Product (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select from your products or quote custom" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="custom">Custom Quotation</SelectItem>
                        {supplierProducts.map((product) => (
                          <SelectItem key={product.supplierProductId} value={product.supplierProductId}>
                            {product.productName} - KES {product.unitPrice.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a product from your catalog or provide a custom quote
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price (KES) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1500"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Price per {rfq.unit}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {totalPrice > 0 && (
                <div className="bg-muted/50 border rounded-lg p-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Price</p>
                  <p className="text-2xl font-bold text-primary">
                    KES {totalPrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rfq.quantity} × KES {form.watch("unitPrice").toLocaleString()}
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="deliveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Time *</FormLabel>
                    <FormControl>
                      <Input placeholder="3-5 business days" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information, terms, or conditions..."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Payment Terms *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="cash" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Cash payment only
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="installment" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Installment payment only
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="both" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Both cash and installment accepted
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isNegotiable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Price is negotiable
                        </FormLabel>
                        <FormDescription>
                          Allow the hospital to negotiate the price
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installmentAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Installment available
                        </FormLabel>
                        <FormDescription>
                          Offer installment payment options
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Quotation...
                    </>
                  ) : (
                    "Submit Quotation (1 Credit)"
                  )}
                </Button>
                <Link to="/dashboard/supplier-rfqs">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
