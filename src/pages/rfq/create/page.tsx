import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const formSchema = z.object({
  productName: z.string().min(3, "Product name must be at least 3 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required (e.g., box, piece, kg)"),
  deliveryLocation: z.string().min(3, "Delivery location is required"),
  urgency: z.enum(["standard", "urgent", "emergency"]),
  specifications: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateRFQPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold">saline.co.ke</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost">Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Unauthenticated>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to create an RFQ</CardDescription>
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
          <CreateRFQForm />
        </Authenticated>
      </div>
    </div>
  );
}

function CreateRFQForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");

  const categories = useQuery(api.categories.getActiveCategories);
  const currentUser = useQuery(api.auth.getCurrentUser);
  const product = useQuery(
    api.products.getProduct,
    productId ? { productId: productId as Id<"products"> } : "skip"
  );
  const createRFQ = useMutation(api.rfqs.createRFQ);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      categoryId: "",
      quantity: 1,
      unit: "",
      deliveryLocation: "",
      urgency: "standard",
      specifications: "",
    },
  });

  // Pre-fill form if product is provided
  useEffect(() => {
    if (product) {
      form.reset({
        productName: product.name,
        categoryId: product.categoryId,
        quantity: product.moq,
        unit: product.unit,
        deliveryLocation: "",
        urgency: "standard",
        specifications: product.description || "",
      });
    }
  }, [product, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const rfqId = await createRFQ({
        productName: data.productName,
        categoryId: data.categoryId as Id<"categories">,
        productId: productId ? (productId as Id<"products">) : undefined,
        quantity: data.quantity,
        unit: data.unit,
        deliveryLocation: data.deliveryLocation,
        urgency: data.urgency,
        specifications: data.specifications || undefined,
      });

      toast.success("RFQ created successfully! Suppliers have been notified.");
      navigate(`/dashboard/rfqs/${rfqId}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create RFQ");
      }
    }
  };

  if (currentUser === undefined || categories === undefined || (productId && product === undefined)) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!currentUser || (currentUser.accountType !== "hospital" && currentUser.accountType !== "hospital_staff")) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Only hospital users can create RFQs</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (currentUser.verificationStatus !== "approved") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Account Pending Verification</CardTitle>
          <CardDescription>
            Your hospital account must be approved before you can create RFQs
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Request for Quotation (RFQ)</h1>
        <p className="text-muted-foreground">
          {productId
            ? "Request quotes for this product from verified suppliers"
            : "Describe what you need and receive competitive quotes"}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Surgical Gloves - Latex Free" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit *</FormLabel>
                      <FormControl>
                        <Input placeholder="box, piece, kg" {...field} />
                      </FormControl>
                      <FormDescription>e.g., box, piece, kg, liter</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="deliveryLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nairobi, Kenya or specific hospital address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="standard" />
                          <div>
                            <FormLabel className="font-normal cursor-pointer">
                              Standard (1-2 weeks)
                            </FormLabel>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="urgent" />
                          <div>
                            <FormLabel className="font-normal cursor-pointer">
                              Urgent (3-5 days)
                            </FormLabel>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 space-y-0">
                          <RadioGroupItem value="emergency" />
                          <div>
                            <FormLabel className="font-normal cursor-pointer">
                              Emergency (24-48 hours)
                            </FormLabel>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specifications / Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific requirements, certifications, or additional information..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted/50 border rounded-lg p-4 text-sm">
                <strong>Note:</strong> Once you submit this RFQ, relevant suppliers will be notified
                and can submit quotations. You can review and accept quotations from your dashboard.
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
                      Creating RFQ...
                    </>
                  ) : (
                    "Create RFQ"
                  )}
                </Button>
                <Link to="/dashboard">
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
