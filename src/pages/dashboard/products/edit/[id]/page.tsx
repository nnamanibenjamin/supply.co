import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import { Loader2Icon, UploadIcon, XIcon } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const formSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  brand: z.string().optional(),
  modelSku: z.string().optional(),
  unit: z.string().min(1, "Unit is required (e.g., box, piece, kg)"),
  defaultUnitPrice: z.number().min(0, "Price must be positive"),
  moq: z.number().min(1, "MOQ must be at least 1"),
  deliveryTime: z.string().min(1, "Delivery time is required"),
  countryOfOrigin: z.string().optional(),
  warranty: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function EditProductPage() {
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
          <Link to="/dashboard/products">
            <Button variant="ghost">Back to Products</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Unauthenticated>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to edit products</CardDescription>
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
          <EditProductForm />
        </Authenticated>
      </div>
    </div>
  );
}

function EditProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [imageIds, setImageIds] = useState<Id<"_storage">[]>([]);

  const categories = useQuery(api.categories.getActiveCategories);
  const currentUser = useQuery(api.auth.getCurrentUser);
  const product = useQuery(api.products.getProduct, id ? { productId: id as Id<"products"> } : "skip");
  const generateUploadUrl = useMutation(api.auth.generateUploadUrl);
  const updateProduct = useMutation(api.products.updateProduct);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      brand: "",
      modelSku: "",
      unit: "",
      defaultUnitPrice: 0,
      moq: 1,
      deliveryTime: "",
      countryOfOrigin: "",
      warranty: "",
      description: "",
    },
  });

  // Initialize form with product data
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        categoryId: product.categoryId,
        brand: product.brand || "",
        modelSku: product.modelSku || "",
        unit: product.unit,
        defaultUnitPrice: product.defaultUnitPrice,
        moq: product.moq,
        deliveryTime: product.deliveryTime,
        countryOfOrigin: product.countryOfOrigin || "",
        warranty: product.warranty || "",
        description: product.description || "",
      });
      setImageIds(product.imageStorageIds);
    }
  }, [product, form]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        return storageId;
      });

      const newImageIds = await Promise.all(uploadPromises);
      setImageIds((prev) => [...prev, ...newImageIds]);
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageIds((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (imageIds.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    if (!id) return;

    try {
      await updateProduct({
        productId: id as Id<"products">,
        name: data.name,
        categoryId: data.categoryId as Id<"categories">,
        brand: data.brand || undefined,
        modelSku: data.modelSku || undefined,
        unit: data.unit,
        defaultUnitPrice: data.defaultUnitPrice,
        moq: data.moq,
        deliveryTime: data.deliveryTime,
        countryOfOrigin: data.countryOfOrigin || undefined,
        warranty: data.warranty || undefined,
        imageStorageIds: imageIds,
        description: data.description || undefined,
      });

      toast.success("Product updated successfully!");
      navigate("/dashboard/products");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update product");
      }
    }
  };

  if (currentUser === undefined || categories === undefined || product === undefined) {
    return (
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Product Not Found</CardTitle>
          <CardDescription>The product you're trying to edit doesn't exist</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/dashboard/products">
            <Button>Return to Products</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser || currentUser.accountType !== "supplier") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Only suppliers can edit products</CardDescription>
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
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">Update your product details</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Product Images */}
              <div className="space-y-2">
                <FormLabel>Product Images *</FormLabel>
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e.target.files)}
                      disabled={uploading}
                      className="hidden"
                      id="images"
                    />
                    <label htmlFor="images" className="cursor-pointer">
                      <UploadIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      {uploading ? (
                        <p className="text-sm font-medium">Uploading...</p>
                      ) : (
                        <>
                          <p className="text-sm font-medium">Click to upload product images</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload multiple images (max 5)
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  {imageIds.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {imageIds.map((imageId, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={`${import.meta.env.VITE_CONVEX_URL}/api/storage/${imageId}`}
                            alt={`Product ${index + 1}`}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
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
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input placeholder="MedCo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modelSku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model/SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="SG-LF-100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
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

                <FormField
                  control={form.control}
                  name="defaultUnitPrice"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="moq"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MOQ *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Minimum Order Quantity</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
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
                  name="countryOfOrigin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="Kenya, USA, China" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="warranty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty</FormLabel>
                    <FormControl>
                      <Input placeholder="1 year manufacturer warranty" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed product description..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={form.formState.isSubmitting || uploading}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Updating Product...
                    </>
                  ) : (
                    "Update Product"
                  )}
                </Button>
                <Link to="/dashboard/products">
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
