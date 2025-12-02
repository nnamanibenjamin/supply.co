import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2Icon } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const formSchema = z.object({
  companyName: z.string().min(3, "Company name must be at least 3 characters"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  cr12Document: z.instanceof(File).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function SupplierSignupForm() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [cr12Id, setCr12Id] = useState<Id<"_storage"> | null>(null);
  
  const categories = useQuery(api.categories.getActiveCategories);
  const generateUploadUrl = useMutation(api.auth.generateUploadUrl);
  const registerSupplier = useMutation(api.auth.registerSupplier);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      categories: [],
    },
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      setCr12Id(storageId);
      toast.success("CR12 document uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload CR12 document");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await registerSupplier({
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        cr12StorageId: cr12Id || undefined,
        categories: data.categories as Id<"categories">[],
      });

      toast.success(
        "Registration successful! You've been awarded 5 free credits. Your account is pending verification."
      );
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    }
  };

  if (categories === undefined) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Registration</CardTitle>
        <CardDescription>
          Register your company to start receiving RFQs and winning business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Medical Supplies Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+254 712 345 678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@supplier.co.ke" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categories"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Categories You Supply</FormLabel>
                    <FormDescription>
                      Select all categories that apply to your business
                    </FormDescription>
                  </div>
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No categories available. Please contact admin.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {categories.map((category) => (
                        <FormField
                          key={category._id}
                          control={form.control}
                          name="categories"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={category._id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category._id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, category._id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== category._id)
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {category.name}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cr12Document"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>CR12 Document (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                            handleFileUpload(file);
                          }
                        }}
                        disabled={uploading}
                        {...field}
                      />
                      {uploading && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                          Uploading...
                        </p>
                      )}
                      {cr12Id && !uploading && (
                        <p className="text-sm text-green-600">✓ Uploaded successfully</p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold">Welcome Bonus: 5 Free Credits!</p>
              <p className="text-sm text-muted-foreground">
                Your account will be pending verification by our admin team. Once approved, 
                you'll be able to view and respond to RFQs.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || uploading}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
